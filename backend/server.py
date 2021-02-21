from base64 import b64encode, b64decode

import uvicorn
from fastapi import FastAPI, Query, HTTPException, status
from nacl.public import PrivateKey
from nacl.secret import SecretBox
from pony.orm import db_session, select, desc, commit, rollback
from pony.orm.core import TransactionIntegrityError
from pydantic import BaseModel, Field
import binascii
import json
from model import db
import os

from model import Shop, Secret

app = FastAPI()


with open(os.environ.get('LEAVENAME_SERVER_CONFIG'), 'r') as f:
    config = json.loads(f.read())
    SERVER_MASTER_SECRET = b64decode(config['SERVER_MASTER_SECRET'])
    SQLITE_LOCATION = config['SQLITE_LOCATION']


db.bind(provider='sqlite', filename=SQLITE_LOCATION, create_db=True)
db.generate_mapping(create_tables=True)


class ShopCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    shop_pub_key: str = Field(alias='shopPubKey', min_length=44, max_length=44)

    class Config:
        allow_population_by_field_name = True


class ShopLoginRequest(BaseModel):
    name: str = Field(min_length=1)
    shop_pub_key: str = Field(alias='shopPubKey', min_length=44, max_length=44)
    server_pub_key: str = Field(alias='serverPubKey', min_length=44, max_length=44)

    class Config:
        allow_population_by_field_name = True



@app.post('/shop')
@db_session
def new_shop(req: ShopCreateRequest):
    try:
        b64decode(req.shop_pub_key)
    except binascii.Error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='公鑰錯誤')
    shop = Shop(name=req.name, shop_pub_key=req.shop_pub_key)
    private_key = PrivateKey.generate()
    box = SecretBox(SERVER_MASTER_SECRET)
    try:
        Secret(shop=shop, server_secret_key=b64encode(box.encrypt(private_key._private_key)).decode('ascii'))
        commit()
    except TransactionIntegrityError:
        rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='公鑰已被使用')

    return b64encode(private_key.public_key._public_key).decode('ascii')


@app.get('/shop')
@db_session
def get_shop(shop_pub_key: str = Query(None, alias='shopPubKey')):
    shop = Shop.get(shop_pub_key=shop_pub_key)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='店舖不存在')
    version, server_secret_key = select((k.version, k.server_secret_key)
                                        for k in Secret if k.shop == shop).order_by(desc(1)).first()
    box = SecretBox(SERVER_MASTER_SECRET)
    server_pub_key = b64encode(PrivateKey(box.decrypt(b64decode(server_secret_key))).public_key._public_key).decode('ascii')

    return ShopLoginRequest(name=shop.name, shop_pub_key=shop_pub_key, server_pub_key=server_pub_key)


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=3001)