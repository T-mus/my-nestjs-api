export const getConnectionString = () =>
    `${process.env.MONGO_PROTOCOL}` +
    `${process.env.MONGO_LOGIN}:${process.env.MONGO_PASSWORD}` +
    `@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
