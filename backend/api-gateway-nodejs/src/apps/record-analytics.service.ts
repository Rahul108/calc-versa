import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Optional per-tool analytics mapping, read from `uiConfig.analytics`:
 *
 *   { "analytics": { "amountField": "amount", "memberField": "member_name", "categoryField": "expense_type" } }
 *
 * When a field is not configured, the legacy heuristics apply (see AGGREGATE_SQL).
 */
export interface AnalyticsFieldMapping {
  amountField?: string;
  memberField?: string;
  categoryField?: string;
}

export interface AggregationResult {
  total_runs: number;
  aggregated_totals: Record<string, number>;
  payload_totals: Record<string, number>;
  per_member_breakdown: Record<
    string,
    { count: number; totalAmount: number; results: Record<string, number>; payloadTotals: Record<string, number> }
  >;
  category_breakdown: Record<string, { count: number; totalAmount: number }>;
  daily_breakdown: Record<string, { count: number; totalAmount: number }>;
  monthly_breakdown: Record<string, { count: number; totalAmount: number }>;
}

const NUMERIC_STRING_RE = `'^[-+]?([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE][-+]?[0-9]+)?$'`;

/** SQL fragment: a jsonb value as float8 if it is a JSON number or a numeric string, else NULL. */
const num = (jsonb: string) => `(CASE
    WHEN jsonb_typeof(${jsonb}) = 'number' THEN (${jsonb})::text::float8
    WHEN jsonb_typeof(${jsonb}) = 'string' AND btrim(${jsonb} #>> '{}') ~ ${NUMERIC_STRING_RE}
      THEN btrim(${jsonb} #>> '{}')::float8
  END)`;

/** SQL fragment: the jsonb value if it is an object, else an empty object (jsonb_each needs an object). */
const obj = (jsonb: string) => `(CASE WHEN jsonb_typeof(${jsonb}) = 'object' THEN ${jsonb} ELSE '{}'::jsonb END)`;

/**
 * One round trip, all aggregation in Postgres. Parameters:
 *   $1 app_id, $2 start date | null, $3 end date | null,
 *   $4 amountField | null, $5 memberField | null, $6 categoryField | null
 *
 * Heuristics when no field is configured (kept for existing tools):
 *   member   = payload.member_name | payload.member_user_id | user_id
 *   category = payload.expense_type | payload.category | payload.type | 'General'
 *   amount   = sum of numeric payload keys containing amount/expense/cost,
 *              else results.total_expense, else 0
 */
const AGGREGATE_SQL = `
WITH base AS (
  SELECT
    r.payload,
    r.results,
    CASE WHEN $5::text IS NOT NULL
      THEN COALESCE(NULLIF(r.payload ->> $5::text, ''), r.user_id::text)
      ELSE COALESCE(NULLIF(r.payload ->> 'member_name', ''), NULLIF(r.payload ->> 'member_user_id', ''), r.user_id::text)
    END AS member,
    CASE WHEN $6::text IS NOT NULL
      THEN COALESCE(NULLIF(r.payload ->> $6::text, ''), 'General')
      ELSE COALESCE(NULLIF(r.payload ->> 'expense_type', ''), NULLIF(r.payload ->> 'category', ''), NULLIF(r.payload ->> 'type', ''), 'General')
    END AS category,
    to_char(r.record_date, 'YYYY-MM-DD') AS day,
    to_char(r.record_date, 'YYYY-MM') AS month,
    CASE WHEN $4::text IS NOT NULL
      THEN COALESCE(${num(`r.payload -> $4::text`)}, 0)
      ELSE COALESCE(
        NULLIF((
          SELECT SUM(${num('kv.value')})
          FROM jsonb_each(${obj('r.payload')}) kv
          WHERE kv.key ILIKE ANY (ARRAY['%amount%', '%expense%', '%cost%'])
        ), 0),
        ${num(`r.results -> 'total_expense'`)},
        0
      )
    END AS amount
  FROM app_records r
  WHERE r.app_id = $1
    AND ($2::date IS NULL OR r.record_date >= $2::date)
    AND ($3::date IS NULL OR r.record_date <= $3::date)
),
res_kv AS (
  SELECT b.member, kv.key, (kv.value)::text::float8 AS v
  FROM base b CROSS JOIN LATERAL jsonb_each(${obj('b.results')}) kv
  WHERE jsonb_typeof(kv.value) = 'number'
),
pay_kv AS (
  SELECT b.member, kv.key, ${num('kv.value')} AS v
  FROM base b CROSS JOIN LATERAL jsonb_each(${obj('b.payload')}) kv
),
pay_kv_num AS (SELECT * FROM pay_kv WHERE v IS NOT NULL)
SELECT
  (SELECT COUNT(*) FROM base)::int AS total_runs,
  (SELECT COALESCE(jsonb_object_agg(key, s), '{}'::jsonb)
     FROM (SELECT key, SUM(v) AS s FROM res_kv GROUP BY key) t) AS aggregated_totals,
  (SELECT COALESCE(jsonb_object_agg(key, s), '{}'::jsonb)
     FROM (SELECT key, SUM(v) AS s FROM pay_kv_num GROUP BY key) t) AS payload_totals,
  (SELECT COALESCE(jsonb_object_agg(m.member, jsonb_build_object(
        'count', m.cnt,
        'totalAmount', m.amt,
        'results', COALESCE((SELECT jsonb_object_agg(key, s) FROM (
            SELECT key, SUM(v) AS s FROM res_kv WHERE res_kv.member = m.member GROUP BY key) x), '{}'::jsonb),
        'payloadTotals', COALESCE((SELECT jsonb_object_agg(key, s) FROM (
            SELECT key, SUM(v) AS s FROM pay_kv_num WHERE pay_kv_num.member = m.member GROUP BY key) y), '{}'::jsonb)
      )), '{}'::jsonb)
     FROM (SELECT member, COUNT(*) AS cnt, SUM(amount) AS amt FROM base GROUP BY member) m) AS per_member_breakdown,
  (SELECT COALESCE(jsonb_object_agg(category, jsonb_build_object('count', cnt, 'totalAmount', amt)), '{}'::jsonb)
     FROM (SELECT category, COUNT(*) AS cnt, SUM(amount) AS amt FROM base GROUP BY category) c) AS category_breakdown,
  (SELECT COALESCE(jsonb_object_agg(day, jsonb_build_object('count', cnt, 'totalAmount', amt)), '{}'::jsonb)
     FROM (SELECT day, COUNT(*) AS cnt, SUM(amount) AS amt FROM base GROUP BY day) d) AS daily_breakdown,
  (SELECT COALESCE(jsonb_object_agg(month, jsonb_build_object('count', cnt, 'totalAmount', amt)), '{}'::jsonb)
     FROM (SELECT month, COUNT(*) AS cnt, SUM(amount) AS amt FROM base GROUP BY month) mo) AS monthly_breakdown
`;

const FIELD_NAME_RE = /^[A-Za-z0-9_\-. ]{1,100}$/;

@Injectable()
export class RecordAnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  /** Reads and validates `uiConfig.analytics`; ignores anything malformed. */
  static fieldMappingFrom(uiConfig: Record<string, any> | null | undefined): AnalyticsFieldMapping {
    const raw = uiConfig?.analytics;
    if (!raw || typeof raw !== 'object') return {};
    const pick = (v: unknown) => (typeof v === 'string' && FIELD_NAME_RE.test(v) ? v : undefined);
    return {
      amountField: pick(raw.amountField),
      memberField: pick(raw.memberField),
      categoryField: pick(raw.categoryField),
    };
  }

  async aggregate(
    appId: string,
    startDate: string | undefined,
    endDate: string | undefined,
    mapping: AnalyticsFieldMapping,
  ): Promise<AggregationResult> {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    const [row] = await this.dataSource.query(AGGREGATE_SQL, [
      appId,
      startDate ?? null,
      endDate ?? null,
      mapping.amountField ?? null,
      mapping.memberField ?? null,
      mapping.categoryField ?? null,
    ]);
    return row as AggregationResult;
  }
}
