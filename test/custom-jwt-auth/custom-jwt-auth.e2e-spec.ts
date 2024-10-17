import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import * as cookieParser from 'cookie-parser'
import mongoose, { Model } from 'mongoose'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

// App-specific imports
import { AppModule } from '../../src/app.module'
import { getConnectionString } from '../common.utils'
import { CreateUserDto } from '../../src/modules/users/dtos/create-user.dto'
import { User } from '../../src/modules/users/users.schema'
import { UserRole } from '../../src/modules/user-roles/user-roles.schema'
import { JwtTokenService } from '../../src/modules/auth/custom-jwt-auth/jwt-token.service'
import { UsersService } from '../../src/modules/users/users.service'
import { SmsService } from '../../src/modules/sms/sms.service'
import { SendGridService } from '../../src/modules/send-grid/send-grid.service'

// Constants & mocks
import {
    INVALID_EMAIL_ERROR,
    INVALID_PHONE_NUMBER_ERROR,
} from '../../src/common/constants/validation-messages.constants'
import {
    ACCOUNT_DELETION_SUCCESS,
    ALREADY_EXISTS_ERROR,
    INVALID_PASSWORD_LENGTH_ERROR,
    INVALID_TOKEN_ERROR,
    LOGOUT_SUCCESS,
    MISSING_REFRESH_PARAMS_ERROR,
    NO_USER_FOUND_ERROR,
    PASSWORD_RESET_SUCCESS_MSG,
    PASSWORD_UPDATE_SUCCESS_MSG,
    UNAUTHORIZED_ERROR_MSG,
    WRONG_PASSWORD_ERROR,
} from '../../src/modules/auth/custom-jwt-auth/custom.jwt-auth.constants'
import {
    mockDeepEmailValidator,
    mockRefreshTokenExp,
    mockSendGridService,
    mockSmsService,
} from './custom-jwt-auth.mocks'

// Validators & Interceptors
import { IsPhoneNumberValidConstraint } from '../../src/common/validators/is-phone-number-valid.validator'
import { FormatPhoneNumberInterceptor } from '../../src/common/interceptors/format-phone-number.interceptor'

// NestJS utilities
import { getModelToken } from '@nestjs/mongoose'
import { ConfigService } from '@nestjs/config'

describe('CustomJwtAuthController (e2e)', () => {
    let app: INestApplication
    let userRoleModel: Model<UserRole>
    let configService: ConfigService
    let usersService: UsersService
    let jwtTokenService: JwtTokenService

    // prettier-ignore
    beforeAll(async () => {
        await mongoose.connect(getConnectionString())

        jest.mock('deep-email-validator', () => mockDeepEmailValidator.mockResolvedValue(true))
        jest.spyOn(IsPhoneNumberValidConstraint.prototype, 'validate').mockImplementation(() => true)
        jest.spyOn(FormatPhoneNumberInterceptor.prototype, 'intercept').mockImplementation((context, next) => next.handle())

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(SendGridService)
            .useValue(mockSendGridService)
            .overrideProvider(SmsService)
            .useValue(mockSmsService)
            .compile()

        app = moduleFixture.createNestApplication()
        app.use(cookieParser())

        await app.init()

        userRoleModel = moduleFixture.get<Model<UserRole>>(getModelToken(UserRole.name))
        configService = moduleFixture.get<ConfigService>(ConfigService)
        usersService = moduleFixture.get<UsersService>(UsersService)
        jwtTokenService = moduleFixture.get<JwtTokenService>(JwtTokenService)
    })

    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.dropDatabase()
        }
        await app.close()
        await mongoose.connection.close()
    })

    describe('Reigster:', () => {
        beforeAll(async () => {
            await userRoleModel.create([
                { value: 'USER', description: 'Default user role' },
                { value: 'ADMIN', description: 'Administrator role' },
            ])
        })

        it('[SUCCESS] /custom-jwt-auth/register (POST)', async () => {
            const dto: CreateUserDto = {
                email: 'test@gmail.com',
                password: 'password',
                phoneNumber: '+1-418-543-8090',
            }
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/register')
                .send(dto)
                .expect(400)

            expect(response.body).toHaveProperty('accessToken')
        })

        it('[FAILURE] /custom-jwt-auth/register (POST) - Invalid email', async () => {
            mockDeepEmailValidator.mockResolvedValueOnce(false)

            const dto: CreateUserDto = {
                email: 'testagmail.com',
                password: 'password',
            }
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/register')
                .send(dto)
                .expect(400)

            expect(response.body.message).toContain(INVALID_EMAIL_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/register (POST) - Invalid password length', async () => {
            const dto: CreateUserDto = {
                email: 'test@gmail.com',
                password: 'pas',
            }
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/register')
                .send(dto)
                .expect(400)

            expect(response.body.message).toContain(INVALID_PASSWORD_LENGTH_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/register (POST) - Invalid phone number', async () => {
            jest.spyOn(IsPhoneNumberValidConstraint.prototype, 'validate').mockImplementationOnce(
                () => false,
            )
            const dto: CreateUserDto = {
                email: 'test@gmail.com',
                password: 'password',
                phoneNumber: '12345',
            }
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/register')
                .send(dto)
                .expect(400)

            expect(response.body.message).toContain(INVALID_PHONE_NUMBER_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/register (POST) - Email already exists', async () => {
            const dto: CreateUserDto = {
                email: 'test@gmail.com',
                password: 'password',
            }
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/register')
                .send(dto)
                .expect(400)

            expect(response.body.message).toContain(ALREADY_EXISTS_ERROR)
        })
    })

    describe('Account activation:', () => {
        // prettier-ignore
        it('[SUCCESS] /custom-jwt-auth/activate:token (GET)', async () => {
            const accountActivationToken = 'some-valid-token'
            const dto = {
                email: 'test1@gmail.com',
                password: 'password',
                accountActivationToken,
            }
            await usersService.createUser(dto)

            const response = await request(app.getHttpServer())
                .get(`/custom-jwt-auth/activate/${accountActivationToken}`)
                .expect(302)

            expect(response.header.location).toBe(`${process.env.CLIENT_BASE_URL}/activation-success`)

            const updatedUser = await usersService.readUserWithRoles({ email: dto.email })
            expect(updatedUser.isAccountActivated).toBe(true)
            expect(updatedUser.accountActivationToken).toBeUndefined()
        })

        // prettier-ignore
        it('[FAILURE] /custom-jwt-auth/activate:token (GET) - Invalid token', async () => {
            const invalidToken = 'invalid-token'
            const response = await request(app.getHttpServer())
                .get(`/custom-jwt-auth/activate/${invalidToken}`)
                .expect(302)

            expect(response.header.location).toBe(`${process.env.CLIENT_BASE_URL}/activation-failure`)
        })
    })

    describe('Login:', () => {
        let createdUser: User
        let deviceId = randomBytes(16).toString('hex')

        beforeAll(async () => {
            createdUser = await usersService.createUser({
                email: 'test2@example.com',
                password: await hash('qwerty', 10),
                phoneNumber: '+1-418-543-8090',
                accountActivationToken: 'some-token',
            })
            const populatedUser = await usersService.readUserWithRoles({ _id: createdUser._id })

            const { refreshToken } = await jwtTokenService.generateTokens(populatedUser)
            await jwtTokenService.saveRefreshToken(createdUser._id, refreshToken, deviceId)
        })

        it('[SUCCESS] /custom-jwt-auth/login (POST)', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/login')
                .set('Cookie', `deviceId=${deviceId};`)
                .send({ email: createdUser.email, password: 'qwerty' })
                .expect(200)

            expect(response.body).toHaveProperty('accessToken')

            let setCookieHeader: string | string[] = response.headers['set-cookie']
            if (!Array.isArray(setCookieHeader)) {
                setCookieHeader = [setCookieHeader]
            }
            const refreshTokenCookie = setCookieHeader.find((cookie: string) =>
                cookie.startsWith('refreshToken='),
            )
            expect(refreshTokenCookie).toBeDefined()
        })

        it('[FAILURE] /custom-jwt-auth/login (POST) - Non-existent email', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/login')
                .send({ email: 'non.existent@gmail.com', password: 'qwerty' })
                .expect(401)

            expect(response.body.message).toContain(NO_USER_FOUND_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/login (POST) - Incorect password', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/login')
                .send({ email: createdUser.email, password: 'ytrewq' })
                .expect(401)

            expect(response.body.message).toContain(WRONG_PASSWORD_ERROR)
        })

        it('[SUCCESS] /custom-jwt-auth/login (POST) - New device login', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/login')
                .send({ email: createdUser.email, password: 'qwerty' })
                .expect(200)

            expect(response.body).toHaveProperty('accessToken')

            let setCookieHeader: string | string[] = response.headers['set-cookie']
            if (!Array.isArray(setCookieHeader)) {
                setCookieHeader = [setCookieHeader]
            }
            const deviceIdCookie = setCookieHeader.find((cookie: string) =>
                cookie.startsWith('deviceId='),
            )
            expect(deviceIdCookie).toBeDefined()

            const refreshTokenCookie = setCookieHeader.find((cookie: string) =>
                cookie.startsWith('refreshToken='),
            )
            expect(refreshTokenCookie).toBeDefined()

            expect(mockSendGridService.sendMail).toHaveBeenCalled()
            if (createdUser.phoneNumber) {
                expect(mockSmsService.sendSms).toHaveBeenCalled()
            } else {
                expect(mockSmsService.sendSms).not.toHaveBeenCalled()
            }
        })
    })

    describe('Refresh tokens:', () => {
        let createdUser: User
        let deviceId = randomBytes(16).toString('hex')
        let createdRefreshToken: string

        beforeAll(async () => {
            createdUser = await usersService.createUser({
                email: 'test3@example.com',
                password: await hash('qwerty', 10),
                accountActivationToken: 'some-token',
            })
            const populatedUser = await usersService.readUserWithRoles({ _id: createdUser._id })
            const { refreshToken } = await jwtTokenService.generateTokens(populatedUser)

            createdRefreshToken = refreshToken
            await jwtTokenService.saveRefreshToken(createdUser._id, refreshToken, deviceId)
        })

        it('[SUCCESS] /custom-jwt-auth/refresh (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/refresh')
                .set('Cookie', [`refreshToken=${createdRefreshToken}`, `deviceId=${deviceId}`])
                .expect(200)

            expect(response.body).toHaveProperty('accessToken')

            let setCookieHeader: string | string[] = response.headers['set-cookie']
            if (!Array.isArray(setCookieHeader)) {
                setCookieHeader = [setCookieHeader]
            }
            const refreshTokenCookie = setCookieHeader.find((cookie: string) =>
                cookie.startsWith('refreshToken='),
            )
            expect(refreshTokenCookie).toBeDefined()
        })

        it('[FAILURE] /custom-jwt-auth/refresh (GET) - No refresh params provided', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/refresh')
                .expect(401)

            expect(response.body.message).toContain(MISSING_REFRESH_PARAMS_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/refresh (GET) - Fake refresh token', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/refresh')
                .set('Cookie', [`refreshToken=some-fake-token`, `deviceId=${deviceId}`])
                .expect(401)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
        })

        // prettier-ignore
        it('[FAILURE] /custom-jwt-auth/refresh (GET) - Expired refresh token', async () => {
            const configGetSpy = jest
                .spyOn(configService, 'get')
                .mockImplementation(mockRefreshTokenExp)

            const expiredUser = await usersService.createUser({
                email: 'expireduser@example.com',
                password: await hash('qwerty', 10),
                accountActivationToken: 'some-token',
            })
            const populatedExpiredUser = await usersService.readUserWithRoles({ _id: expiredUser._id})

            const { refreshToken } = await jwtTokenService.generateTokens(populatedExpiredUser)
            await jwtTokenService.saveRefreshToken(expiredUser._id, refreshToken, deviceId)

            await new Promise((resolve) => setTimeout(resolve, 1100))

            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`, `deviceId=${deviceId}`])
                .expect(401)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
            configGetSpy.mockRestore()
        })

        // prettier-ignore
        it('[FAILURE] /custom-jwt-auth/refresh (GET) - Non-existent refresh token in DB', async () => {
            const populatedUser = await usersService.readUserWithRoles({ _id: createdUser._id})
            
            const { refreshToken } = await jwtTokenService.generateTokens(populatedUser)
            await jwtTokenService.saveRefreshToken(createdUser._id, refreshToken, deviceId)

            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/refresh')
                .set('Cookie', [`refreshToken=${createdRefreshToken}`, `deviceId=${deviceId}`]) 
                .expect(401)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
        })
    })

    describe('Password recovery:', () => {
        let resetToken: string
        let userEmail: string = 'test4@example.com'

        beforeAll(async () => {
            await usersService.createUser({
                email: userEmail,
                password: await hash('qwerty', 10),
                accountActivationToken: 'some-token',
            })
        })

        it('[SUCCESS] /custom-jwt-auth/reset-password (POST)', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/reset-password')
                .send({ email: userEmail })
                .expect(200)

            expect(response.body.message).toContain(PASSWORD_RESET_SUCCESS_MSG)
            expect(mockSendGridService.sendMail).toHaveBeenCalled()

            const user = await usersService.readUserWithRoles({ email: userEmail })
            resetToken = user.passwordResetToken

            expect(resetToken).toBeDefined()
        })

        it('[FAILURE] /custom-jwt-auth/reset-password (POST) - Non-existent email', async () => {
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/reset-password')
                .send({ email: 'random@gmail.com' })
                .expect(400)

            expect(response.body.message).toContain(NO_USER_FOUND_ERROR)
        })

        it('[SUCCESS] /custom-jwt-auth/update-password (POST)', async () => {
            const newPassword = 'qwerty123'
            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/update-password')
                .send({ token: resetToken, newPassword })
                .expect(200)

            expect(response.body.message).toContain(PASSWORD_UPDATE_SUCCESS_MSG)
        })

        it('[FAILURE] /custom-jwt-auth/update-password (POST) - Fake reset token', async () => {
            const newPassword = 'qwerty123'

            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/update-password')
                .send({ token: 'some-fake-token', newPassword })
                .expect(400)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
        })

        it('[FAILURE] /custom-jwt-auth/update-password (POST) - Expired reset token', async () => {
            const newPassword = 'qwerty123'
            const user = await usersService.readUserWithRoles({ email: userEmail })

            user.passwordResetExpires = new Date(Date.now() - 1000)
            await user.save()

            const response = await request(app.getHttpServer())
                .post('/custom-jwt-auth/update-password')
                .send({ token: resetToken, newPassword })
                .expect(400)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
        })
    })

    describe('Logout:', () => {
        let createdUser: User
        let deviceId = randomBytes(16).toString('hex')
        let createdRefreshToken: string

        beforeAll(async () => {
            createdUser = await usersService.createUser({
                email: 'test5@example.com',
                password: await hash('qwerty', 10),
                accountActivationToken: 'some-token',
            })
            const populatedUser = await usersService.readUserWithRoles({ _id: createdUser._id })
            const { refreshToken } = await jwtTokenService.generateTokens(populatedUser)

            createdRefreshToken = refreshToken
            await jwtTokenService.saveRefreshToken(createdUser._id, refreshToken, deviceId)
        })

        it('[SUCCESS] /custom-jwt-auth/logout (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/logout')
                .set('Cookie', [`refreshToken=${createdRefreshToken}`, `deviceId=${deviceId}`])
                .expect(200)

            expect(response.body.message).toContain(LOGOUT_SUCCESS)

            const cookies = response.headers['set-cookie']
            expect(cookies).toBeDefined()

            const cookiesArray = Array.isArray(cookies) ? cookies : [cookies]
            const refreshTokenCookie = cookiesArray.find((cookie) =>
                cookie.startsWith('refreshToken='),
            )
            const deviceIdCookie = cookiesArray.find((cookie) => cookie.startsWith('deviceId='))

            expect(refreshTokenCookie).toContain('refreshToken=;')
            expect(deviceIdCookie).toContain('deviceId=;')
        })

        it('[FAILURE] /custom-jwt-auth/logout (GET) - Invalid or missing refresh token', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/logout')
                .set('Cookie', [`refreshToken=invalidToken`, `deviceId=${deviceId}`])
                .expect(401)

            expect(response.body.message).toContain(UNAUTHORIZED_ERROR_MSG)
        })
    })

    describe('Account deletion:', () => {
        let createdUser: User
        let deviceId = randomBytes(16).toString('hex')
        let createdRefreshToken: string

        beforeAll(async () => {
            createdUser = await usersService.createUser({
                email: 'test6@example.com',
                password: await hash('qwerty', 10),
                accountActivationToken: 'some-token',
            })
            const populatedUser = await usersService.readUserWithRoles({ _id: createdUser._id })
            const { refreshToken } = await jwtTokenService.generateTokens(populatedUser)

            createdRefreshToken = refreshToken
            await jwtTokenService.saveRefreshToken(createdUser._id, refreshToken, deviceId)
        })

        // prettier-ignore
        it('[SUCCESS] /custom-jwt-auth/delete (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/delete')
                .set('Cookie', [`refreshToken=${createdRefreshToken}`, `deviceId=${deviceId}`])
                .expect(200)

            expect(response.body.message).toContain(ACCOUNT_DELETION_SUCCESS)

            const cookies = response.headers['set-cookie']
            expect(cookies).toBeDefined()

            const cookiesArray = Array.isArray(cookies) ? cookies : [cookies]
            const refreshTokenCookie = cookiesArray.find((cookie) => cookie.startsWith('refreshToken='))
            const deviceIdCookie = cookiesArray.find((cookie) => cookie.startsWith('deviceId='))

            expect(refreshTokenCookie).toContain('refreshToken=;')
            expect(deviceIdCookie).toContain('deviceId=;')

            const deletedUser = await usersService.readUserWithRoles({ _id: createdUser._id })
            expect(deletedUser).toBeNull()
        })

        it('[FAILURE] /custom-jwt-auth/delete (GET) - Invalid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .get('/custom-jwt-auth/delete')
                .set('Cookie', [`refreshToken=invalidToken`, `deviceId=${deviceId}`])
                .expect(401)

            expect(response.body.message).toContain(INVALID_TOKEN_ERROR)
        })
    })
})
