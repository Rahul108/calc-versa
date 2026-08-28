import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { App } from './App.entity';
import { User } from './User.entity';

@Entity('app_records')
@Index('idx_app_records_app_date', ['app_id', 'record_date'])
@Index('idx_app_records_user', ['user_id'])
export class AppRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  app_id!: string;

  @Column()
  user_id!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  results!: Record<string, any> | null;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  record_date!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app!: App;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
