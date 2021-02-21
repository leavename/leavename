import axios from 'axios'

const API_ROOT = 'https://leavename.com/api';


export const Shop = {
    registerShop: (name, shopPubKey) => axios.post(`${API_ROOT}/shop`, {name, shopPubKey}),
    findShopName: (shopPubKey) => axios.get(`${API_ROOT}/shop`, {params: {shopPubKey}}),
}
