import { SetMetadata } from '@nestjs/common'
import { METADATA_ROLES_KEY } from '../constants/metadata.constants'

export const Roles = (...roles: string[]) => SetMetadata(METADATA_ROLES_KEY, roles)
