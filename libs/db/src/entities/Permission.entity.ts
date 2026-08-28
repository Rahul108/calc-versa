import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { UserPermission } from './UserPermission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ default: false })
  write!: boolean;

  @OneToMany(() => UserPermission, (userPerm) => userPerm.permission)
  users!: UserPermission[];
}
