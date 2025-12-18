#### Create new project (DO NOT RUN THIS)
Run
```bash
npx create-next-app@latest letzhist  \
  --typescript \
  --eslint \
  --tailwind \
  --src-dir \
  --app \
  --use-npm
```

Click enter on everything else.


# View the db:
1.  Open VsCode terminal.
2.  Run the following command:
```bash
docker exec -it letzhist_mysql mysql -u letzuser -p
```
3.  When prompted for the password, type: **`letzpass`**.
4.  Once inside the MySQL shell, you can run standard queries:
```sql
USE letz_hist_db;
SHOW TABLES;
SELECT * FROM users;
```