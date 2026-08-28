import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { App } from './App.entity';

@Entity('users_n_app_mappings')
@Unique(['user_id', 'app_id'])
export class UsersNAppMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  app_id!: string;

  @Column()
  user_id!: string;

  @Column({ default: true })
  status!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.apps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => App, (app) => app.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app!: App;
}
