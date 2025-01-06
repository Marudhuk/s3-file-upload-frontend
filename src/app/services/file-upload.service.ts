import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:3000'; // Remove /api from base URL

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{location: string}>(`${this.apiUrl}/uploads`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<{location: string}>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Handle progress but don't return it
            const progress = Math.round((100 * event.loaded) / (event.total ?? 1));
            console.log(`Upload progress: ${progress}%`);
            return '';
          case HttpEventType.Response:
            // Return the URL from the response
            const response = event as HttpResponse<{location: string}>;
            return response?.body?.location ?? '';
          default:
            return '';
        }
      })
    );
  }
} 