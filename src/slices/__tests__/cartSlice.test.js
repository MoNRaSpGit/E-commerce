import { describe, it, expect } from "vitest";
import cartReducer, { addItem, removeItem, incQty, decQty, clearCart, setCart } from "../cartSlice";

describe("cartSlice", () => {
  it("addItem agrega un producto nuevo con qty=1", () => {
    const initial = { items: [] };

    const next = cartReducer(
      initial,
      addItem({ id: 1, name: "Pan", price: 50, image: null })
    );

    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({
      id: 1,
      name: "Pan",
      price: 50,
      qty: 1,
    });
  });

  it("addItem si existe incrementa qty", () => {
    const initial = {
      items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 1 }],
    };

    const next = cartReducer(initial, addItem({ id: 1, name: "Pan", price: 50 }));

    expect(next.items).toHaveLength(1);
    expect(next.items[0].qty).toBe(2);
  });

  it("removeItem elimina por id", () => {
    const initial = {
      items: [
        { id: 1, name: "Pan", price: 50, image: null, qty: 1 },
        { id: 2, name: "Leche", price: 80, image: null, qty: 1 },
      ],
    };

    const next = cartReducer(initial, removeItem(1));

    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe(2);
  });

  it("incQty suma 1 si existe", () => {
    const initial = {
      items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 1 }],
    };

    const next = cartReducer(initial, incQty(1));

    expect(next.items[0].qty).toBe(2);
  });

  it("decQty resta 1 y si llega a 0 lo elimina", () => {
    const initial = {
      items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 1 }],
    };

    const next = cartReducer(initial, decQty(1));

    expect(next.items).toHaveLength(0);
  });

  it("clearCart vacía el carrito", () => {
    const initial = {
      items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 3 }],
    };

    const next = cartReducer(initial, clearCart());

    expect(next.items).toHaveLength(0);
  });

  it("setCart setea items si payload es array", () => {
    const initial = { items: [] };

    const next = cartReducer(
      initial,
      setCart([{ id: 1, name: "Pan", price: 50, image: null, qty: 2 }])
    );

    expect(next.items).toHaveLength(1);
    expect(next.items[0].qty).toBe(2);
  });

  it("setCart si payload no es array deja items vacío", () => {
    const initial = { items: [{ id: 1, name: "Pan", price: 50, image: null, qty: 2 }] };

    const next = cartReducer(initial, setCart(null));

    expect(next.items).toHaveLength(0);
  });
});
