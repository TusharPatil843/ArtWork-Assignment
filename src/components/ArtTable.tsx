// src/components/ArtTable.tsx
import { useEffect, useState } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { Artwork } from "../types/artwork";
import { fetchArtworks } from "../services/api";
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useRef } from 'react';

const ArtTable = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRowsMap, setSelectedRowsMap] = useState<Map<number, Artwork>>(new Map());
  const [selectedRowsForPage, setSelectedRowsForPage] = useState<Artwork[]>([]);
  const rowsPerPage = 12;

  const overlayRef = useRef<OverlayPanel>(null);
  const [selectCount, setSelectCount] = useState<number>(0);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadArtworks(currentPage + 1);
  }, [currentPage]);

  const loadArtworks = async (page: number) => {
  try {
    setLoading(true);
    const response = await fetchArtworks(page);
    setArtworks(response.data);
    setTotalRecords(response.pagination.total);

    // manual selection and chevron down button functionality
    const selected = response.data.filter((row) =>
      selectedRowsMap.has(row.id)
    );
    setSelectedRowsForPage(selected);
  } catch (error) {
    console.error("Error fetching artworks:", error);
  } finally {
    setLoading(false);
  }
};


  const onPageChange = (e: DataTablePageEvent) => {
    setCurrentPage(e.page ?? 0);
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const newMap = new Map(selectedRowsMap);
    const currentIds = new Set(artworks.map((item) => item.id));

    // Remove any deselected rows 
    currentIds.forEach((id) => {
      if (newMap.has(id)) newMap.delete(id);
      bulkSelectedIds.delete(id);
    });

    // Add selected ones
    e.value.forEach((row) => {
      newMap.set(row.id, row);
    });

    setSelectedRowsMap(newMap);
    setSelectedRowsForPage(e.value);
  };

  const handleBulkSelection = async (count: number) => {
  const newIds = new Set<number>();
  const newMap = new Map(selectedRowsMap);
  let page = 1;

  try {
    while (newIds.size < count) {
      const response = await fetchArtworks(page);
      const data = response.data;

      for (let i = 0; i < data.length && newIds.size < count; i++) {
        const artwork = data[i];
        newIds.add(artwork.id);
        newMap.set(artwork.id, artwork);
      }

      if (page >= response.pagination.total_pages) break;
      page++;
    }

    setBulkSelectedIds(newIds);
    setSelectedRowsMap(newMap);

    // Update selected rows for current page
    const selectedForThisPage = artworks.filter(row => newMap.has(row.id));
    setSelectedRowsForPage(selectedForThisPage);
  } catch (error) {
    console.error("Bulk selection error:", error);
  }
};


  return (
    <div className="card">
      <h2>Artworks</h2>
      <DataTable
        value={artworks}
        loading={loading}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        first={currentPage * rowsPerPage}
        onPage={onPageChange}
        selection={selectedRowsForPage}
        onSelectionChange={onSelectionChange}
        dataKey="id"
      >
        <Column
  selectionMode="multiple"
  headerStyle={{ width: '3rem' }}
  header={() => (
    <div className="flex align-items-center gap-2">
      <span className="pi pi-chevron-down cursor-pointer" onClick={(e) => overlayRef.current?.toggle(e)} />
      <OverlayPanel ref={overlayRef} showCloseIcon>
        <div className="p-fluid" style={{ width: '200px' }}>
          <label htmlFor="selectCount">Select Top N</label>
          <InputNumber
            id="selectCount"
            value={selectCount}
            onValueChange={(e) => setSelectCount(e.value ?? 0)}
            min={1}
          />
          <Button
            label="Submit"
            className="mt-2"
            onClick={() => {
              handleBulkSelection(selectCount);
              overlayRef.current?.hide();
            }}
          />
        </div>
      </OverlayPanel>
    </div>
  )}
/>

        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Year" />
        <Column field="date_end" header="End Year" />
      </DataTable>

      
    </div>
  );
};

export default ArtTable;
