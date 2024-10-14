import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Observable } from 'rxjs'
import { METADATA_ROLES_KEY } from '../constants/metadata.constants'
import { TokenPayload } from '../../modules/auth/custom-jwt-auth/custom-jwt-auth.types'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest()
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(METADATA_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        if (!requiredRoles) {
            return true
        }
        const authHeader = req.headers.authorization
        if (!authHeader) {
            throw new UnauthorizedException()
        }
        const [bearer, token] = authHeader.split(' ')
        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException()
        }
        try {
            const userPayload = this.jwtService.verify<TokenPayload>(token)
            req.userPayload = userPayload

            return requiredRoles.some((role) => userPayload.roles.includes(role))
        } catch (error) {
            throw new ForbiddenException('Access denied')
        }
    }
}
