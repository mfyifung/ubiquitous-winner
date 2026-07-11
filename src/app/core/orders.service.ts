import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, OrderFilters, OrdersMeta } from './order.model';

/**
 * All data for the Order Lists page comes from the backend via relative
 * `/api/*` calls. The dev proxy (proxy.conf.json) forwards `/api` to the
 * backend box — no host is ever embedded here.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private readonly http: HttpClient) {}

  getOrders(filters: OrderFilters = {}): Observable<Order[]> {
    let params = new HttpParams();
    for (const status of filters.status ?? []) {
      params = params.append('status', status);
    }
    for (const type of filters.type ?? []) {
      params = params.append('type', type);
    }
    if (filters.date) {
      params = params.set('date', filters.date);
    }
    return this.http.get<Order[]>('/api/orders', { params });
  }

  getMeta(): Observable<OrdersMeta> {
    return this.http.get<OrdersMeta>('/api/orders/meta');
  }
}
