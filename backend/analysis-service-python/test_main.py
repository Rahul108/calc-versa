import logging
import os

os.environ.setdefault("LOGS_DIR", os.path.join(os.path.dirname(__file__), "logs"))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

client = TestClient(main.app)


def test_health_echoes_correlation_id():
    res = client.get("/health", headers={"x-correlation-id": "abc-123"})
    assert res.status_code == 200
    assert res.json()["correlationId"] == "abc-123"
    assert res.headers["x-correlation-id"] == "abc-123"


def test_computes_real_statistics():
    res = client.post(
        "/analysis/process",
        json={"dataset_id": "d1", "values": [2, 4, 4, 4, 5, 5, 7, 9], "metrics": ["mean", "median", "std_dev", "p25", "p90"]},
    )
    assert res.status_code == 200
    r = res.json()["results"]
    assert r["mean"] == 5
    assert r["median"] == 4.5
    assert round(r["std_dev"], 4) == 2.1381
    assert r["p25"] == 4
    assert round(r["p90"], 2) == 7.6


def test_defaults_to_all_metrics_and_handles_single_value():
    res = client.post("/analysis/process", json={"values": [3]})
    r = res.json()["results"]
    assert set(r) == set(main.ALL_METRICS)
    assert r["std_dev"] == 0 and r["p90"] == 3 and r["count"] == 1


def test_rejects_empty_values_and_unknown_metrics():
    assert client.post("/analysis/process", json={"values": []}).status_code == 422
    assert client.post("/analysis/process", json={"values": [1], "metrics": ["mode"]}).status_code == 422


def test_daily_file_handler_uses_dated_file_name(tmp_path):
    handler = main.DailyFileHandler(str(tmp_path), "app")
    handler.setFormatter(main.JSONFormatter())
    handler.emit(logging.LogRecord("t", logging.INFO, __file__, 1, "hello", None, None))
    handler.close()
    files = os.listdir(tmp_path)
    assert len(files) == 1 and files[0].startswith("app-") and files[0].endswith(".log")
