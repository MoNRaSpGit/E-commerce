import { describe, it, expect } from "vitest";
import cartReducer, {
  addItem,
  removeItem,
  incQty,
  decQty,
  clearCart,
  setCart,
  selectCartTotalItems,
  selectCartTotalPrice,
} from "../slices/cartSlice";

describe("cartSlice", () => {
  describe("reducers", () => {
    it("addItem: agrega nuevo producto con qty=1 y normaliza price/image", () => {
      const initial = { items: [] };

      // price string -> number, image undefined -> null
      const next = cartReducer(
        initial,
        addItem({ id: 1, name: "Pan", price: "50" })
      );

      expect(next.items).toHaveLength(1);
      expect(next.items[0]).toMatchObject({
        id: 1,
        name: "Pan",
        price: 50,
        qty: 1,
        image: null,
      });
    });

    it("addItem: si existe incrementa qty sin duplicar", () => {
      const initial = {
        items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 1 }],
      };

      const next = cartReducer(initial, addItem({ id: 1, name: "Pan", price: 50 }));

      expect(next.items).toHaveLength(1);
      expect(next.items[0].qty).toBe(2);
    });

    it("removeItem: elimina por id", () => {
      const initial = {
        items: [
          { id: 1, name: "Pan", price: 50, image: null, qty: 1 },
          { id: 2, name: "Leche", price: 80, image: null, qty: 1 },
        ],
      };

      const next = cartReducer(initial, removeItem(1));

      expect(next.items.map((x) => x.id)).toEqual([2]);
    });

    it("incQty/decQty: incrementa y decrementa; si qty llega a 0 elimina", () => {
      const initial = {
        items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 2 }],
      };

      const afterInc = cartReducer(initial, incQty(1));
      expect(afterInc.items[0].qty).toBe(3);

      const afterDec1 = cartReducer(afterInc, decQty(1));
      expect(afterDec1.items[0].qty).toBe(2);

      const afterDec2 = cartReducer(afterDec1, decQty(1));
      const afterDec3 = cartReducer(afterDec2, decQty(1)); // 1 -> 0 => elimina
      expect(afterDec3.items).toHaveLength(0);
    });

    it("decQty: si el id no existe no rompe ni cambia items", () => {
      const initial = {
        items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 1 }],
      };

      const next = cartReducer(initial, decQty(999));
      expect(next.items).toHaveLength(1);
      expect(next.items[0].qty).toBe(1);
    });

    it("clearCart: vacía el carrito", () => {
      const initial = {
        items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 3 }],
      };

      const next = cartReducer(initial, clearCart());
      expect(next.items).toEqual([]);
    });

    it("setCart: acepta array; si no es array deja vacío", () => {
      const initial = { items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 2 }] };

      const ok = cartReducer(initial, setCart([{ id: 2, name: "Leche", price: 80, image: null, qty: 1 }]));
      expect(ok.items.map((x) => x.id)).toEqual([2]);

      const bad = cartReducer(initial, setCart(null));
      expect(bad.items).toEqual([]);
    });
  });

  describe("selectors", () => {
    it("calcula totales (items y precio) de forma robusta", () => {
      const state = {
        cart: {
          items: [
            { id: 1, name: "Pan", price: "50", qty: 2 },   // 100
            { id: 2, name: "Leche", price: 80, qty: 1 },   // 80
            { id: 3, name: "Azúcar", price: "x", qty: 5 }, // 0 (price inválido)
          ],
        },
      };

      expect(selectCartTotalItems(state)).toBe(8);
      expect(selectCartTotalPrice(state)).toBe(180);
    });
  });
});
