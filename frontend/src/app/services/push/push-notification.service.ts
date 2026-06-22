import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  private apiUrl = `${environment.apiGateway}/bff/push`;

  constructor(private http: HttpClient, private swPush: SwPush) {}

  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  async requestSubscription(): Promise<void> {
    if (!this.swPush.isEnabled) return;

    try {
      const keyRes = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${this.apiUrl}/vapid-key`)
      );

      const sub = await this.swPush.requestSubscription({
        serverPublicKey: keyRes.publicKey
      });

      const subJson = sub.toJSON();
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/subscribe`, {
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.['p256dh'],
          auth: subJson.keys?.['auth']
        })
      );
    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.swPush.isEnabled) return;
    try {
      const sub = await this.swPush.subscription.pipe().toPromise() as any;
      if (sub) {
        await firstValueFrom(this.http.post(`${this.apiUrl}/unsubscribe`, { endpoint: sub.endpoint }));
        await this.swPush.unsubscribe();
      }
    } catch (err) {
      console.warn('Push unsubscribe failed:', err);
    }
  }
}
