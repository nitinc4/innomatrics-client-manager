"use client"

import { useState } from "react";
import * as XLSX from "xlsx";
import styles from "./BulkUpload.module.css";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTime12h } from "@/lib/utils";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [preview, setPreview] = useState<any[]>([]);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreview(data.slice(0, 5)); // Show first 5 rows
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        contactNumber: "1234567890",
        location: "New York",
        business: "Software",
        requirement: "Web App",
        description: "Needs a new website",
        status: "Active",
        assign: "admin",
        callbackMonth: "2024-04",
        callback: "2024-04-15 10:00 AM"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "innomatrics_client_template.xlsx");
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const response = await fetch("/api/clients/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          setMessage({ type: "success", text: result.message });
          setFile(null);
          setPreview([]);
          setTimeout(() => router.push("/"), 2000);
        } else {
          setMessage({ type: "error", text: result.error || "Upload failed" });
        }
        setIsUploading(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setMessage({ type: "error", text: "Error processing file." });
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className={styles.title}>Bulk Client Upload</h1>
        <p className={styles.subtitle}>Upload multiple clients at once using an Excel spreadsheet.</p>
      </header>

      <div className={styles.content}>
        <div className={styles.optionsGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon} style={{ background: '#6366f115', color: '#6366f1' }}>
              <Download size={32} />
            </div>
            <h3>1. Download Template</h3>
            <p>Get the standard Excel template to ensure your data is formatted correctly.</p>
            <button onClick={downloadTemplate} className={styles.templateBtn}>
              <FileSpreadsheet size={18} />
              Download Excel Template
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon} style={{ background: '#10b98115', color: '#10b981' }}>
              <Upload size={32} />
            </div>
            <h3>2. Upload Data</h3>
            <p>Select your completed template and upload it. 12-hour time format (AM/PM) is supported!</p>
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
                id="file-upload"
                className={styles.hiddenInput}
              />
              <label htmlFor="file-upload" className={styles.customFileInput}>
                {file ? file.name : "Choose Excel File"}
              </label>
            </div>
            <button 
              onClick={handleUpload} 
              className={styles.uploadBtn}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Start Bulk Import
                </>
              )}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <div className={styles.alertContent}>
              <strong>{message.type === 'success' ? 'Success!' : 'Error'}</strong>
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className={styles.previewSection}>
            <h3>Data Preview (First 5 Rows)</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map(key => <th key={key}>{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j}>
                          {Object.keys(row)[j] === 'callback' ? formatTime12h(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
