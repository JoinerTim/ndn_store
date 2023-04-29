export enum OrderStatus {
    Pending = 'PENDING', //đã đặt hàng 
    Confirm = 'CONFIRM', //đã xác nhận thanh toán
    Processing = 'PROCESSING', //đang xử lý
    Delivering = "DELIVERING", //đang vận chuyển
    Complete = 'COMPLETE', //hoàn thành
    Cancel = 'CANCEL',//hủy
    ReturnRefund = 'RETURN_REFUND', //hoàn trả hàng
}

export enum OrderCancelBy {
    Customer = 'CUSTOMER',
    Staff = 'STAFF'
}

export enum DeliveryStatus {
    Pending = 'PENDING', //đang giao, chờ giao
    Fail = 'FAIL', //bùng hàng
    Complete = 'COMPLETE' //giao hoàn tất
}

export enum PaymentStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE',
    Refund = 'REFUND', //hoàn tiền
}

export enum EDeliveryType {
    Manual = 'MANUAL', //giao từ store
    Factory = 'FACTORY' //giao từ nhà máy
}