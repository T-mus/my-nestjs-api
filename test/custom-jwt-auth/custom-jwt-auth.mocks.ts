export const mockSendGridService = {
    sendMail: jest.fn(),
    renderHtmlFromTemplate: jest.fn().mockResolvedValue('<html></html>'),
}

export const mockSmsService = {
    sendSms: jest.fn(),
}

export const mockDeepEmailValidator = {
    mockResolvedValue: (valid: boolean) => ({
        validate: jest.fn().mockResolvedValue({ valid }),
    }),
    mockResolvedValueOnce: (valid: boolean) => ({
        validate: jest.fn().mockResolvedValueOnce({ valid }),
    }),
}

// For alterante way
export const mockPhoneNumberUtil = {
    mockParse: () => ({
        parse: jest.fn().mockReturnValue({}),
    }),

    mockParseOnce: () => ({
        parse: jest.fn().mockReturnValueOnce({}),
    }),

    mockIsValidNumber: (isValid: boolean) => ({
        isValidNumber: jest.fn().mockReturnValue(isValid),
    }),

    mockIsValidNumberOnce: (isValid: boolean) => ({
        isValidNumber: jest.fn().mockReturnValueOnce(isValid),
    }),
}

export const mockRefreshTokenExp = (key: string) => {
    if (key === 'JWT_REFRESH_TOKEN_EXPIRATION') {
        return '1s'
    }
    return process.env[key]
}
