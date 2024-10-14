export const getConnectionString = () =>
    'mongodb+srv://' +
    `${process.env.MONGO_LOGIN}:${process.env.MONGO_PASSWORD}` +
    `@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
