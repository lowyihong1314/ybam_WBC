from run import app, db

def add_validfy_column():
    with app.app_context():
        engine = db.engine

        with engine.connect() as conn:
            # 检查字段是否已存在（防止重复执行）
            result = conn.execute(
                db.text("PRAGMA table_info(register_data);")
            ).fetchall()

            columns = [row[1] for row in result]

            if "validfy" in columns:
                print("✅ column `validfy` already exists")
                return

            print("➕ adding column `validfy` ...")
            conn.execute(
                db.text(
                    "ALTER TABLE register_data "
                    "ADD COLUMN validfy BOOLEAN DEFAULT 0;"
                )
            )
            print("🎉 done")

if __name__ == "__main__":
    add_validfy_column()
