// src/components/ArtTable.tsx
import { useEffect, useState, useRef } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { Artwork } from "../types/artwork";
import { fetchArtworks } from "../services/api";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

const ArtTable = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRowsMap, setSelectedRowsMap] = useState<Map<number, Artwork>>(new Map());
  const [selectedRowsForPage, setSelectedRowsForPage] = useState<Artwork[]>([]);
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(0);
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());


  const rowsPerPage = 12;
  const overlayRef = useRef<OverlayPanel>(null);
  const [selectCount, setSelectCount] = useState<number>(0);

  useEffect(() => {
    loadArtworks(currentPage + 1);
  }, [currentPage]);

  const loadArtworks = async (page: number , tempBulkCount = bulkSelectCount) => {
    try {
      setLoading(true);
      const response = await fetchArtworks(page);
      setArtworks(response.data);
      setTotalRecords(response.pagination.total);

      // Calculate which rows to select based on global position
      const globalStartIndex = currentPage * rowsPerPage;
      const selectedFromBulk = response.data.filter((row, index) =>
          globalStartIndex + index < tempBulkCount && !deselectedIds.has(row.id)
      );


      // Add manually selected rows too
      const manual = response.data.filter((row) => selectedRowsMap.has(row.id));
      const combined = [...selectedFromBulk];

      manual.forEach((row) => {
        if (!combined.find((r) => r.id === row.id)) {
          combined.push(row);
        }
      });

      setSelectedRowsForPage(combined);
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
  const newSelectionIds = new Set(e.value.map(row => row.id));
  const updatedDeselectedIds = new Set(deselectedIds);

  // Detect deselected rows on current page
  currentIds.forEach((id) => {
    if (bulkSelectCount && (currentPage * rowsPerPage + artworks.findIndex(row => row.id === id)) < bulkSelectCount) {
      if (!newSelectionIds.has(id)) {
        updatedDeselectedIds.add(id); // was selected via bulk, now deselected
        newMap.delete(id); // remove from selected
      } else {
        updatedDeselectedIds.delete(id); // if reselected again
        newMap.set(id, artworks.find(row => row.id === id)!);
      }
    } else {
      if (!newSelectionIds.has(id)) {
        newMap.delete(id);
      } else {
        newMap.set(id, artworks.find(row => row.id === id)!);
      }
    }
  });

  setDeselectedIds(updatedDeselectedIds);
  setSelectedRowsMap(newMap);
  setSelectedRowsForPage(e.value);
};


  const handleBulkSelection = (count: number) => {
    setBulkSelectCount(count);
    loadArtworks(currentPage + 1, count); // Refresh current page selections
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
        selectionMode="checkbox"
        dataKey="id"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
          header={() => (
            <div className="flex align-items-center gap-2">
              <span
                className="pi pi-chevron-down cursor-pointer"
                onClick={(e) => overlayRef.current?.toggle(e)}
              />
              <OverlayPanel ref={overlayRef} showCloseIcon>
                <div className="p-fluid" style={{ width: "200px" }}>
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
