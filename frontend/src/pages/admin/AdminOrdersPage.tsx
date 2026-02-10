// frontend/src/pages/admin/AdminOrdersPage.tsx

import { useEffect, useState } from "react";
import { Eye, ChevronDown, X, Ruler } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminService } from "@/services/adminService";
import toast from "react-hot-toast";

interface OrderItem {
  productName: string;
  productCode: string;
  productImage?: string;
  colorName?: string;
  variantSize?: string;  // ✅ НОВОЕ
  quantity: number;
  price: number;
  total?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  total: number;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  deliveryType: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждён",
  PROCESSING: "Готовится",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const allStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await adminService.getOrders();
      setOrders(data);
    } catch (error) {
      toast.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      toast.success("Статус обновлён");
      loadOrders();
      setStatusDropdown(null);
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Заказы
      </h1>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                #{selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Клиент</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Телефон</p>
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="font-medium text-blue-600"
                  >
                    {selectedOrder.customerPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Доставка</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryType === "DELIVERY"
                      ? "Доставка"
                      : "Самовывоз"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Оплата</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Товары</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 bg-gray-50 p-3 rounded-lg"
                    >
                      {/* Фото товара */}
                      <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.productName || "Товар"}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {/* Код товара */}
                          <span className="text-xs text-gray-500">
                            {item.productCode || "—"}
                          </span>

                          {/* ✅ НОВОЕ: Размер */}
                          {item.variantSize && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              <Ruler className="w-3 h-3" />
                              {item.variantSize}
                            </span>
                          )}

                          {/* Цвет */}
                          {item.colorName && (
                            <span className="text-xs text-gray-500">
                              🎨 {item.colorName}
                            </span>
                          )}

                          {/* Количество */}
                          <span className="text-xs text-gray-500">
                            × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <p className="font-medium text-sm shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ✅ Итоги с учётом скидки */}
              <div className="pt-3 border-t space-y-1">
                {selectedOrder.subtotal && selectedOrder.discount && selectedOrder.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Подытог:</span>
                      <span>{formatPrice(selectedOrder.subtotal)} сум</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Оптовая скидка:</span>
                      <span>-{formatPrice(selectedOrder.discount)} сум</span>
                    </div>
                  </>
                )}
                {selectedOrder.deliveryFee !== undefined && selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Доставка:</span>
                    <span>{formatPrice(selectedOrder.deliveryFee)} сум</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="font-semibold">Итого:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatPrice(selectedOrder.total)} сум
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Загрузка...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Заказов нет
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.customerName}
                  </p>
                  <p className="text-sm text-gray-500">{order.customerPhone}</p>

                  {/* ✅ Краткий список товаров с размерами */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
                        {item.productCode || item.productName?.slice(0, 15)}
                        {item.variantSize && (
                          <span className="ml-1 font-medium text-blue-600">{item.variantSize}</span>
                        )}
                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{order.items.length - 3} ещё
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-gray-900 mt-2">
                    {formatPrice(order.total)} сум
                    {order.discount && order.discount > 0 && (
                      <span className="text-xs text-green-600 ml-2 font-normal">
                        (скидка -{formatPrice(order.discount)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setStatusDropdown(
                          statusDropdown === order.id ? null : order.id,
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {statusDropdown === order.id && (
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 min-w-[130px]">
                        {allStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(order.id, status)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                              status === order.status
                                ? "bg-gray-100 font-medium"
                                : ""
                            }`}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}