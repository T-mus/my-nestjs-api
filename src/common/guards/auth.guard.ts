import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Observable } from 'rxjs'

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        try {
            const req = context.switchToHttp().getRequest()
            const authHeader = req.headers.authorization

            const [bearer, token] = authHeader.split(' ')
            if (!authHeader) {
                throw new UnauthorizedException()
            }
            if (bearer !== 'Bearer' || !token) {
                throw new UnauthorizedException()
            }
            const userPayload = this.jwtService.decode(token)
            req.userPayload = userPayload

            return true
        } catch (error) {
            throw new UnauthorizedException()
        }
    }
}
