#!/usr/bin/env node

import { checkIamPolicy } from './lib/utils/iamChecker.js';

const args = process.argv.slice(2);
const type = args[0] || 'functions-v1';

const configs = {
  'functions-v1': {
    service: 'functions',
    apiVersion: 'v1',
    method: 'POST',
  },
  'functions-v2': {
    service: 'functions',
    apiVersion: 'v2',
    method: 'POST',
  },
  'run-v1': {
    service: 'run',
    apiVersion: 'v1',
    method: 'POST',
  },
  'run-get': {
    service: 'run',
    apiVersion: 'v1',
    method: 'GET',
  },
};

const config = configs[type];

if (!config) {
  console.error(`Tipo desconhecido: ${type}`);
  console.error('Tipos disponíveis:', Object.keys(configs).join(', '));
  process.exit(1);
}

(async () => {
  try {
    const result = await checkIamPolicy(config);
    console.log('STATUS:', result.status);
    console.log(result.data);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
