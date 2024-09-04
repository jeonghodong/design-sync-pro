'use strict';

const { merge } = require('webpack-merge');
const Dotenv = require('dotenv-webpack');

const common = require('./webpack-configs/webpack.common');
const developmentConfig = require('./webpack-configs/webpack.dev');
const productionConfig = require('./webpack-configs/webpack.prod');

module.exports = (_env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const config = isDevelopment ? developmentConfig : productionConfig;

  return merge(common, config, {
    plugins: [
      new Dotenv({
        path: './.env', // .env 파일 경로
        safe: true, // .env.example 파일을 사용하여 필요한 환경 변수를 확인
        systemvars: true, // 시스템 환경 변수도 불러옴
        silent: true, // 에러 발생 시 빌드가 실패하지 않도록 함
        defaults: false, // .env.defaults 파일을 사용하지 않음
      }),
    ],
  });
};
