// lib/publicApi.ts
import axios from 'axios';
import { API_BASE } from '../config/env';
export const publicApi = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});
