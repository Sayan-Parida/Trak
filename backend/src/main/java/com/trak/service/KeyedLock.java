package com.trak.service;

import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Narrowly scoped, reference-counted keyed lock.
 *
 * <p>Serializes access for the same key (e.g. {@code (sessionId, url)}) while allowing
 * independent keys to execute concurrently. Automatically cleans up map entries when
 * the reference count reaches zero to prevent unbounded memory growth.
 *
 * <p>The caller owns the lock lifetime: acquire before opening a transaction,
 * release after the transaction commits or rolls back. This ensures no thread
 * holds an open database transaction while waiting for the lock.
 */
@Component
public class KeyedLock {

    private static class RefCountedLock {
        final ReentrantLock lock = new ReentrantLock();
        int refCount = 1;
    }

    private final ConcurrentHashMap<Object, RefCountedLock> lockMap = new ConcurrentHashMap<>();

    public void lock(Object key) {
        if (key == null) {
            return;
        }
        RefCountedLock refLock;
        synchronized (lockMap) {
            refLock = lockMap.compute(key, (k, existing) -> {
                if (existing == null) {
                    return new RefCountedLock();
                } else {
                    existing.refCount++;
                    return existing;
                }
            });
        }
        refLock.lock.lock();
    }

    public void unlock(Object key) {
        if (key == null) {
            return;
        }
        synchronized (lockMap) {
            RefCountedLock refLock = lockMap.get(key);
            if (refLock != null) {
                refLock.lock.unlock();
                refLock.refCount--;
                if (refLock.refCount <= 0) {
                    lockMap.remove(key);
                }
            }
        }
    }

    /**
     * Value record for composite (sessionId, url) locking.
     */
    public record SessionUrlKey(String sessionId, String url) {
        public SessionUrlKey {
            Objects.requireNonNull(sessionId, "sessionId must not be null");
            Objects.requireNonNull(url, "url must not be null");
        }
    }
}
