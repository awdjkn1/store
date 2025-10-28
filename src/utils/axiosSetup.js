import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;
// Ensure cookies (HttpOnly session token) are sent with requests
axios.defaults.withCredentials = true;

export default axios;
