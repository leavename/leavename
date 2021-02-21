from pony.orm import Database, PrimaryKey, Required, Optional, Set

db = Database()


class Shop(db.Entity):
    id = PrimaryKey(int, auto=True)
    name = Required(str)
    shop_pub_key = Optional(str, unique=True)
    secrets = Set('Secret')


class Secret(db.Entity):
    id = PrimaryKey(int, auto=True)
    shop = Required(Shop)
    version = Required(int, default=0)
    server_secret_key = Required(str, 96, unique=True)
