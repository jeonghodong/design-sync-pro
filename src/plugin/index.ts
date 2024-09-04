/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
figma.showUI(__html__, { width: 300, height: 200 });

figma.ui.onmessage = async (msg) => {
  const handleNoIconsSelected = (action) => {
    figma.ui.postMessage({
      type: `${action}-status`,
      message: `No icons selected for ${action}. Please select icon components.`,
      data: false,
    });
  };

  const getSelectedIcons = () => {
    const selectedNodes = figma.currentPage.selection;
    console.log('selectedNodes', selectedNodes);
    return selectedNodes.filter(
      (node) => node.name.startsWith('ic') || node.name.startsWith('il'),
    );
  };

  /**
   * 아이콘 내보내기
   */
  if (msg.type === 'export-icons') {
    const icons = getSelectedIcons();

    console.log('Selected icons:', icons);

    if (icons.length === 0) {
      handleNoIconsSelected('export');
      return;
    }

    const selectedIcons = [];

    for (const icon of icons) {
      try {
        const svg = await icon.exportAsync({ format: 'SVG' });
        const iconName = icon?.name;

        selectedIcons.push({ name: iconName, data: svg });

        figma.ui.postMessage({
          type: 'export-status',
          message: `Processed ${iconName}: Ready for upload`,
          data: true,
        });
      } catch (error) {
        console.error('Error exporting icon:', icon.name, error);
        figma.ui.postMessage({
          type: 'export-status',
          message: `Error processing ${icon.name}: ${error.message}`,
          data: false,
        });
      }
    }

    figma.ui.postMessage({
      type: 'export-complete',
      message: `Exported ${icons.length} icons`,
      data: {
        icons: selectedIcons,
      },
    });
  }

  /**
   * 아이콘 삭제
   */
  if (msg.type === 'delete-icons') {
    const icons = getSelectedIcons();

    console.log('Selected icons for deletion:', icons);

    if (icons.length === 0) {
      handleNoIconsSelected('delete');
      return;
    }

    const iconsToDelete = [];

    for (const icon of icons) {
      const iconName = icon?.name;
      iconsToDelete.push({ name: iconName });

      figma.ui.postMessage({
        type: 'delete-status',
        message: `Marked ${iconName} for deletion`,
        data: true,
      });
    }

    figma.ui.postMessage({
      type: 'delete-complete',
      message: `Marked ${icons.length} icons for deletion`,
      data: {
        icons: iconsToDelete,
      },
    });
  }
};
