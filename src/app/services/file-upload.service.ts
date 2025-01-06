import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, from, lastValueFrom } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface UploadPart {
  ETag: string;
  PartNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:3000/upload';
  private CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<string> {
    return from(this.handleMultipartUpload(file));
  }

  private async handleMultipartUpload(file: File): Promise<string> {
    // Step 1: Initiate the upload
    const initiateResponse = await lastValueFrom(
      this.http.post<{ uploadId: string }>(`${this.apiUrl}/initiate`, {
        filename: file.name,
        mimetype: file.type
      })
    );

    const uploadId = initiateResponse.uploadId;
    const parts: UploadPart[] = [];
    const totalParts = Math.ceil(file.size / this.CHUNK_SIZE);

    // Step 2: Upload parts
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('filename', file.name);

      const partResponse = await lastValueFrom(
        this.http.post<{ part: UploadPart }>(
          `${this.apiUrl}/part/${uploadId}/${partNumber}`,
          formData
        )
      );

      parts.push(partResponse.part);
      
      // Calculate and log progress
      const progress = Math.round((partNumber / totalParts) * 100);
      console.log(`Upload progress: ${progress}%`);
    }

    // Step 3: Complete the upload
    const completeResponse = await lastValueFrom(
      this.http.post<{ location: string }>(
        `${this.apiUrl}/complete/${uploadId}`,
        {
          filename: file.name,
          parts: parts
        }
      )
    );

    return completeResponse.location;
  }
} 