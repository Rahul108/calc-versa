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
import { Permission } from './Permission.entity';
import { App } from './App.entity';

@Entity('user_permissions')
@Unique(['user_id', 'permission_id', 'app_id'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  permission_id!: string;

  @Column()
  app_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Permission, (permission) => permission.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;

  @ManyToOne(() => App, (app) => app.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app!: App;
}
