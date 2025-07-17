import { useEffect } from 'react';

/**
 * Hook personnalisé pour améliorer la navigation clavier
 * Gère les raccourcis clavier courants et l'accessibilité
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape pour fermer les modales, menus, etc.
      if (event.key === 'Escape') {
        // Fermer les éléments avec data-closable="true"
        const closableElements = document.querySelectorAll('[data-closable="true"]');
        closableElements.forEach((element) => {
          const closeButton = element.querySelector('[data-close-button="true"]');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });
      }

      // Tab pour la navigation focus
      if (event.key === 'Tab') {
        // Améliorer la visibilité du focus
        document.body.classList.add('keyboard-navigation');
      }

      // Enter et Space pour activer les éléments cliquables
      if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.hasAttribute('data-keyboard-clickable')) {
          event.preventDefault();
          (activeElement as HTMLElement).click();
        }
      }

      // Flèches pour la navigation dans les listes
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.hasAttribute('data-keyboard-list')) {
          event.preventDefault();
          const listContainer = activeElement.closest('[data-keyboard-list-container]');
          if (listContainer) {
            const listItems = listContainer.querySelectorAll('[data-keyboard-list]');
            const currentIndex = Array.from(listItems).indexOf(activeElement);
            let nextIndex = currentIndex;

            if (event.key === 'ArrowDown') {
              nextIndex = (currentIndex + 1) % listItems.length;
            } else {
              nextIndex = (currentIndex - 1 + listItems.length) % listItems.length;
            }

            (listItems[nextIndex] as HTMLElement).focus();
          }
        }
      }
    };

    // Détecter si l'utilisateur utilise le clavier
    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * Hook pour rendre un élément cliquable au clavier
 */
export const useKeyboardClickable = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.setAttribute('data-keyboard-clickable', 'true');
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
    }
  }, [ref]);
};

/**
 * Hook pour créer une liste navigable au clavier
 */
export const useKeyboardList = (containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.setAttribute('data-keyboard-list-container', 'true');
      const items = container.querySelectorAll('[data-keyboard-list]');
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });
    }
  }, [containerRef]);
};