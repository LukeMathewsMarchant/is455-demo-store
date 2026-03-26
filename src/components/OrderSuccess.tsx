type OrderSuccessProps = {
  orderId: number;
  total: number;
};

export function OrderSuccess({ orderId, total }: OrderSuccessProps) {
  return (
    <p className="success">
      Order #{orderId} placed successfully. Demo total: ${total.toFixed(2)}
    </p>
  );
}
