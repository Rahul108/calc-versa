import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UsersNAppMapping } from './UsersNAppMapping.entity';
import { UserPermission } from './UserPermission.entity';

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  description!: string;

  @Column({ default: true })
  status!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  inputsConfig!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  formulaConfig!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  uiConfig!: Record<string, any> | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => UsersNAppMapping, (mapping) => mapping.app)
  users!: UsersNAppMapping[];

  @OneToMany(() => UserPermission, (permission) => permission.app)
  permissions!: UserPermission[];
}
