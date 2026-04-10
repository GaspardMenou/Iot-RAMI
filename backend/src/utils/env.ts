const env = (
  envConstName: string,
  defaultValue: string | number,
  isNumber = false
): string | number => {
  if (isNumber) {
    return (
      parseInt(process.env[`${envConstName}`] || "", 10) ||
      (defaultValue as number)
    );
  }

  return process.env[`${envConstName}`] || defaultValue;
};

const envs = {
  NODE_ENV: env("NODE_ENV", "development") as string,
  PORT: env("NODE_PORT", 3000, true) as number,
  DB_HOST: env("DB_HOST", "localhost") as string,
  DB_PORT: env("DB_PORT", 5432, true) as number,
  DB_NAME: env("DB_NAME", "postgres") as string,
  DB_USER: env("DB_USER", "postgres") as string,
  DB_PASSWORD: env("DB_PASSWORD", "postgres") as string,
  JWT_SECRET: env("JWT_SECRET", "secret") as string,
  JWT_EXPIRATION: env("JWT_EXPIRATION", "1d") as string,
  BCRYPT_SALT_ROUNDS: env("BCRYPT_SALT_ROUNDS", 10, true) as number,
  MAIL_HOST: env("MAIL_HOST", "smtp.gmail.com") as string,
  MAIL_PORT: env("MAIL_PORT", 465, true) as number,
  MAIL_USER: env("MAIL_USER", "user") as string,
  MAIL_PASSWORD: env("MAIL_PASSWORD", "password") as string,
  KAFKA_BROKERS: env("KAFKA_BROKERS", "kafka:9092") as string,
  REFRESH_TOKEN_SECRET: env("REFRESH_TOKEN_SECRET", "refresh_secret") as string,
  REFRESH_TOKEN_EXPIRATION: env("REFRESH_TOKEN_EXPIRATION", "7d") as string,
};

if (envs.NODE_ENV === "production") {
  if (envs.JWT_SECRET === "secret") {
    throw new Error(
      "[env] JWT_SECRET must be set to a strong value in production"
    );
  }
  if (envs.REFRESH_TOKEN_SECRET === "refresh_secret") {
    throw new Error(
      "[env] REFRESH_TOKEN_SECRET must be set to a strong value in production"
    );
  }
}

export { envs };
