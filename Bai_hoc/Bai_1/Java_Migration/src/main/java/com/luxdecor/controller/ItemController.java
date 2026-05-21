package com.luxdecor.controller;

import com.luxdecor.model.Item;
import com.luxdecor.service.ItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items")
public class ItemController {
    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    record ItemCreateRequest(String name, String description, Double price) {}

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody ItemCreateRequest req) {
        Item created = service.create(req.name, req.description, req.price);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<Item> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> get(@PathVariable Integer id) {
        Item item = service.get(id);
        if (item == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> update(@PathVariable Integer id, @RequestBody ItemCreateRequest req) {
        Item updated = service.update(id, req.name, req.description, req.price);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        boolean removed = service.delete(id);
        if (!removed) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}
