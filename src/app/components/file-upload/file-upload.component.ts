import { Component, ViewChild, ElementRef } from '@angular/core';
import { FileUploadService } from '../../services/file-upload.service';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  isDragging = false;
  uploadedImageUrl: string | null = null;
  
  constructor(
    private fileUploadService: FileUploadService,
    private toastr: ToastrService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File) {
    // Add your file validation logic here
    const maxSize = 1024 * 1024 * 1024; // 1GB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      this.toastr.error('File size should not exceed 1GB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only JPEG, PNG and PDF files are allowed');
      return;
    }

    this.selectedFile = file;
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.toastr.error('Please select a file first');
      return;
    }

    this.toastr.info('Upload started');
    this.fileUploadService.uploadFile(this.selectedFile).subscribe({
      next: (url: string) => {
        this.uploadedImageUrl = url;
        if (url) {
          this.toastr.success('Upload completed successfully');
          this.resetUpload();
        }
      },
      error: (error) => {
        this.toastr.error('Upload failed: ' + error.message);
        this.uploadProgress = 0;
      }
    });
  }

  resetUpload() {
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.fileInput.nativeElement.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  ngOnDestroy() {
    // Clean up blob URL when component is destroyed
    if (this.uploadedImageUrl) {
      URL.revokeObjectURL(this.uploadedImageUrl);
    }
  }
} 