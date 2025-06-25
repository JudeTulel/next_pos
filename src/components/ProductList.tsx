type Product = {
  barcode: string;
  name: string;
  price: number;
  available: number;
  imageUrl: string;
};

type Props = {
  products: Product[];
  onAddToCart: (product: Product) => void;
};

export default function ProductList({ products, onAddToCart }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div
          key={product.barcode}
          className="bg-white/5 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition"
          onClick={() => onAddToCart(product)}
        >
          <img src={product.imageUrl} alt={product.name} className="rounded-xl mb-2" />
          <div className="text-white font-semibold">{product.name}</div>
          <div className="text-white/70 text-sm">${product.price.toFixed(2)}</div>
          <div className="text-xs text-blue-400">{product.available} available</div>
        </div>
      ))}
    </div>
  );
}
