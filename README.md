# BMD shop clone from 248 ABH [backend]

[![N|Solid](https://bmdsolutions.vn/wp-content/uploads/2020/01/bmd_logo.png)](https://nodesource.com/products/nsolid)

## Yêu cầu hệ thống

- Nodejs v14 trở lên
- Trình quản lý package node: npm
- Trình quản lý tiến trình: pm2
- Cơ sở dữ liệu: Mariadb version 10.x trở lên

## Cài đặt

Sửa đổi các trường cấu hình ở file .env

```sh
#HTTP
HOST={domain} //app.hebec.vn
PORT=8080
#Database
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
DATABASE_NAME=database_name
#SSL
SSL=Đường dẫn file SSL
#FILE
LOG_DIR=Đường dẫn tuyệt đối thư  mục chứa file log
UPLOAD_DIR=Đường dẫn tuyệt đối thư mục chứa file upload
STATIC_DIR=Đường dẫn tuyệt đối file tĩnh
```

# Run Dev

Để run được ở môi trường development thì phải theo các bước sau:

- Tạo folder log ở root project
- Tạo folder uploads ở root project
- Cấu hình lại các trường LOG_DIR, UPLOAD_DIR, STATIC_DIR ở file cấu hình .env
- Kiểm trả lại chính xác các trường trong file .env đã định sẵn ở trên

Sau đó run lệnh

```
npm i
npm run dev
```

#### Build production

Trước tiên hãy run lệnh ở local

```
npm i
npm run build
```

- Upload tất cả các file, thư mục trong thư mục mà lệnh trên đã build ra lên server: Thư mục dist
- Tạo folder log ở ngoài root project 1 cấp
- Tạo uploads log ở ngoài root project 1 cấp

Sau đó run lệnh sau để hoàn tất

```
npm i
cd root_project
pm2 start dist/src/index --name backend --watch
```

## Liên kết tham khảo

|        | Link                               |
| ------ | ---------------------------------- |
| NodeJs | [https://nodejs.org/en/][pldb]     |
| PM2    | [https://pm2.keymetrics.io/][plgh] |
| TS.ED  | [https://tsed.io/][plgh]           |

## License

Copyright BMD Solutions

## Các package OS

### Cài đặt Imagemagick

`apt install imagemagick`

## Git deploy

web admin tổng: https://bmdapp.store@shop-admin.bmdapp.store/plesk-git/shop-admin.git
web admin của cửa hàng: https://bmdapp.store@shop.bmdapp.store/plesk-git/admin.git
