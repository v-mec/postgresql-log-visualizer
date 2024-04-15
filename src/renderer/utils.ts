import { EdgeSingular, ElementDefinition } from 'cytoscape';

export const hasFiles = (
  state:
    | {
        files: File[];
      }
    | {
        exportedFile: File;
      }
): state is { files: File[] } => 'files' in state;

export const getEdgeColor = (
  edge: EdgeSingular,
  sequence: string[] | null,
  highlightId: string | undefined
) => {
  if (highlightId && edge.data('id') === highlightId) {
    return '#FF8C00';
  }
  if (
    sequence?.find(
      (statement, index) =>
        edge.data('target') === statement &&
        edge.data('source') === sequence[index + 1]
    )
  ) {
    return '#002aff';
  }
  if (edge.data('isTransaction')) {
    return '#7fb3dd';
  }
  return '#b3b3b3';
};

export const handleDownload = (elements: ElementDefinition[]) => {
  const data = JSON.stringify(elements);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'graph.json';
  link.href = url;
  link.click();
};
