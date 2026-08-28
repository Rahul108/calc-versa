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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column()
  address!: string;

  @Column()
  contact_no!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: true })
  status!: boolean;

  @Column()
  password!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => UsersNAppMapping, (mapping) => mapping.user)
  apps!: UsersNAppMapping[];

  @OneToMany(() => UserPermission, (permission) => permission.user)
  permissions!: UserPermission[];
}
