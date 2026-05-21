package com.luxdecor.service;

import com.luxdecor.model.Item;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ItemService {
    private final ConcurrentHashMap<Integer, Item> store = new ConcurrentHashMap<>();
    private final AtomicInteger idGen = new AtomicInteger(1);

    public Item create(String name, String description, Double price) {
        int id = idGen.getAndIncrement();
        Item item = new Item(id, name, description, price, Instant.now());
        store.put(id, item);
        return item;
    }

    public List<Item> list() {
        return new ArrayList<>(store.values());
    }

    public Item get(Integer id) {
        return store.get(id);
    }

    public Item update(Integer id, String name, String description, Double price) {
        Item existing = store.get(id);
        if (existing == null) return null;
        Item updated = new Item(id, name, description, price, existing.getCreatedAt());
        store.put(id, updated);
        return updated;
    }

    public boolean delete(Integer id) {
        return store.remove(id) != null;
    }
}
