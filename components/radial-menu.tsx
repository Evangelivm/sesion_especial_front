"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  User,
  Heart,
  AmbulanceIcon as FirstAid,
  ClipboardList,
  CalendarCheck,
  BarChart2,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { getParticipantes } from "@/lib/connections";

interface RadialMenuOption {
  id: string;
  label: string;
  icon: string;
}

interface CompanyGroup {
  id: string;
  range: string;
  companies: Company[];
}

interface Company {
  id: string;
  name: string;
  isBack?: boolean;
}

interface RadialMenuProps {
  options: RadialMenuOption[];
  position: { x: number; y: number };
  onSelect: (optionId: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function RadialMenu({
  options,
  position,
  onSelect,
  onClose,
  isMobile = false,
}: RadialMenuProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showCompanyGroups, setShowCompanyGroups] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [participantes, setParticipantes] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedParticipanteId, setSelectedParticipanteId] = useState<
    number | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const companyGroupsRef = useRef<(HTMLDivElement | null)[]>([]);
  const companiesRef = useRef<(HTMLDivElement | null)[]>([]);
  const centerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Back option for company view
  const backOption: Company = {
    id: "back",
    name: "Atrás",
    isBack: true,
  };

  // Company groups with their individual companies
  const companyGroups: CompanyGroup[] = [
    {
      id: "g1",
      range: "1-5",
      companies: [
        { id: "c1", name: "C1" },
        { id: "c2", name: "C2" },
        { id: "c3", name: "C3" },
        { id: "c4", name: "C4" },
        { id: "c5", name: "C5" },
      ],
    },
    {
      id: "g2",
      range: "6-10",
      companies: [
        { id: "c6", name: "C6" },
        { id: "c7", name: "C7" },
        { id: "c8", name: "C8" },
        { id: "c9", name: "C9" },
        { id: "c10", name: "C10" },
      ],
    },
    {
      id: "g3",
      range: "11-15",
      companies: [
        { id: "c11", name: "C11" },
        { id: "c12", name: "C12" },
        { id: "c13", name: "C13" },
        { id: "c14", name: "C14" },
        { id: "c15", name: "C15" },
      ],
    },
    {
      id: "g4",
      range: "16-20",
      companies: [
        { id: "c16", name: "C16" },
        { id: "c17", name: "C17" },
        { id: "c18", name: "C18" },
        { id: "c19", name: "C19" },
        { id: "c20", name: "C20" },
      ],
    },
    {
      id: "g5",
      range: "21-25",
      companies: [
        { id: "c21", name: "C21" },
        { id: "c22", name: "C22" },
        { id: "c23", name: "C23" },
        { id: "c24", name: "C24" },
        { id: "c25", name: "C25" },
      ],
    },
    {
      id: "g6",
      range: "26-30",
      companies: [
        { id: "c26", name: "C26" },
        { id: "c27", name: "C27" },
        { id: "c28", name: "C28" },
        { id: "c29", name: "C29" },
        { id: "c30", name: "C30" },
      ],
    },
  ];

  // Map icon strings to Lucide components
  const iconMap: Record<string, LucideIcon> = {
    Users,
    User,
    Heart,
    FirstAid,
    ClipboardList,
    CalendarCheck,
    BarChart2,
  };

  // Initialize GSAP animations
  useEffect(() => {
    if (!menuRef.current || !overlayRef.current) return;

    // Create a new timeline
    const tl = gsap.timeline({ paused: true });
    timelineRef.current = tl;

    // Initial state
    gsap.set(menuRef.current, { scale: 0.5, opacity: 0 });
    gsap.set(centerRef.current, { scale: 0, opacity: 0 });
    gsap.set(optionsRef.current, { scale: 0, opacity: 0 });
    gsap.set(overlayRef.current, { opacity: 0 });

    // Animate the overlay first
    tl.to(overlayRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });

    // Animate the background
    tl.to(
      menuRef.current,
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
      },
      "-=0.1"
    );

    // Animate the center
    tl.to(
      centerRef.current,
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      },
      "-=0.3"
    );

    // Animate each option with stagger
    tl.to(
      optionsRef.current,
      {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "back.out(1.7)",
      },
      "-=0.2"
    );

    // Play the timeline
    tl.play();

    return () => {
      // Clean up
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  // Load participantes
  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        const data = await getParticipantes();
        setParticipantes(data);
      } catch (error) {
        console.error("Error al cargar participantes:", error);
      }
    };

    fetchParticipantes();
  }, []);

  // Handle input appearance and disappearance
  useEffect(() => {
    if (showInput) {
      // Fade out menu options
      optionsRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0.3,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });

      // Expand center for input
      if (centerRef.current) {
        gsap.to(centerRef.current, {
          width: "320px",
          height: "60px",
          borderRadius: "12px",
          backgroundColor: "rgba(255, 255, 255, 1)",
          duration: 0.4,
          ease: "back.out(1.7)",
        });
      }

      // Animate input container
      if (inputContainerRef.current) {
        gsap.fromTo(
          inputContainerRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, delay: 0.2, ease: "power2.out" }
        );
      }
    } else {
      // Restore menu options if not showing company groups or companies
      if (!showCompanyGroups && !showCompanies) {
        optionsRef.current.forEach((ref, i) => {
          if (ref) {
            gsap.to(ref, {
              opacity: 1,
              scale: i === activeIndex ? 1.25 : 1,
              duration: 0.3,
              ease: "power2.out",
            });
          }
        });
      }

      // Restore center if not showing company groups or companies
      if (!showCompanyGroups && !showCompanies && centerRef.current) {
        gsap.to(centerRef.current, {
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "rgba(30, 41, 59, 0.9)",
          duration: 0.4,
          ease: "back.out(1.7)",
        });
      }
    }
  }, [showInput, activeIndex, showCompanyGroups, showCompanies]);

  // Handle company groups appearance and disappearance
  useEffect(() => {
    if (showCompanyGroups) {
      // Hide original options
      optionsRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0,
            scale: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
          });
        }
      });

      // Hide individual companies if they were showing
      companiesRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0,
            scale: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
          });
        }
      });

      // Update center text
      if (centerRef.current) {
        gsap.to(centerRef.current, {
          backgroundColor: "rgba(30, 41, 59, 0.9)",
          duration: 0.3,
          ease: "power2.out",
        });
      }

      // Animate company groups with stagger
      companyGroupsRef.current.forEach((ref, index) => {
        if (ref) {
          gsap.fromTo(
            ref,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              delay: index * 0.05,
              ease: "back.out(1.7)",
            }
          );
        }
      });
    } else if (!showCompanies) {
      // Hide company groups if they were showing and not showing individual companies
      companyGroupsRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0,
            scale: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
          });
        }
      });

      // Show original options if not showing input or companies
      if (!showInput && !showCompanies) {
        optionsRef.current.forEach((ref, i) => {
          if (ref) {
            gsap.to(ref, {
              opacity: 1,
              scale: i === activeIndex ? 1.25 : 1,
              duration: 0.4,
              delay: 0.1,
              ease: "back.out(1.7)",
            });
          }
        });
      }
    }
  }, [showCompanyGroups, showInput, activeIndex, showCompanies]);

  // Handle individual companies appearance and disappearance
  useEffect(() => {
    if (showCompanies && activeGroupIndex !== null) {
      // Hide company groups
      companyGroupsRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0,
            scale: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
          });
        }
      });

      // Animate individual companies with stagger
      companiesRef.current.forEach((ref, index) => {
        if (ref) {
          gsap.fromTo(
            ref,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              delay: index * 0.05,
              ease: "back.out(1.7)",
            }
          );
        }
      });
    } else if (!showCompanyGroups) {
      // Hide individual companies if they were showing and not showing company groups
      companiesRef.current.forEach((ref) => {
        if (ref) {
          gsap.to(ref, {
            opacity: 0,
            scale: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
          });
        }
      });
    }
  }, [showCompanies, activeGroupIndex, showCompanyGroups]);

  // Handle mouse movement (for desktop)
  useEffect(() => {
    if (isMobile) return; // Skip for mobile devices

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showInput) {
          setShowInput(false);
        } else if (showCompanies) {
          setShowCompanies(false);
          setShowCompanyGroups(true);
        } else if (showCompanyGroups) {
          setShowCompanyGroups(false);
        } else {
          closeMenu();
        }
      }
    };

    const handleCustomClose = () => {
      closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("closeRadialMenu", handleCustomClose);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("closeRadialMenu", handleCustomClose);
    };
  }, [
    position,
    options.length,
    activeIndex,
    isMobile,
    showInput,
    showCompanyGroups,
    showCompanies,
  ]);

  const closeMenu = () => {
    if (!timelineRef.current || !overlayRef.current) return;

    // Crear una nueva timeline para el cierre
    const closeTl = gsap.timeline({
      onComplete: onClose,
    });

    // Animar las opciones para que desaparezcan con un efecto stagger
    closeTl.to(
      optionsRef.current,
      {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        stagger: 0.03,
        ease: "back.in(1.7)",
      },
      0
    );

    // Animar los grupos de compañías si están visibles
    if (showCompanyGroups) {
      closeTl.to(
        companyGroupsRef.current,
        {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "back.in(1.7)",
        },
        0
      );
    }

    // Animar las compañías individuales si están visibles
    if (showCompanies) {
      closeTl.to(
        companiesRef.current,
        {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "back.in(1.7)",
        },
        0
      );
    }

    // Animar el círculo central
    closeTl.to(
      centerRef.current,
      {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
      },
      0.1
    );

    // Animar el fondo del menú
    closeTl.to(
      menuRef.current,
      {
        scale: 0.5,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      },
      0.2
    );

    // Animar el overlay al final
    closeTl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      },
      0.3
    );
  };

  const handleOptionClick = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const clickedOption = options[index];

    // If clicking the same option that's already active (second click)
    if (activeIndex === index) {
      // If it's the "Persona" option, show the input
      if (clickedOption.id === "person") {
        setShowInput(true);
        setShowCompanyGroups(false);
        setShowCompanies(false);
      }
      // If it's the "Compañía" option, show company groups
      else if (clickedOption.id === "companies") {
        setShowCompanyGroups(true);
        setShowInput(false);
        setShowCompanies(false);
      } else {
        // For other options, proceed with selection
        handleClick(index);
      }
      return;
    }

    // First click - just activate the option
    setActiveIndex(index);
    setShowInput(false); // Hide input if it was showing
    setShowCompanyGroups(false); // Hide company groups if they were showing
    setShowCompanies(false); // Hide individual companies if they were showing

    // Animate the clicked option
    if (optionsRef.current[index]) {
      // Reset all options first
      optionsRef.current.forEach((ref, i) => {
        if (ref) {
          gsap.to(ref, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });

      // Then animate the clicked one
      gsap.to(optionsRef.current[index], {
        scale: 1.25,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleCompanyGroupClick = (groupIndex: number) => {
    // Set the active group and show individual companies
    setActiveGroupIndex(groupIndex);
    setShowCompanies(true);
    setShowCompanyGroups(false);
  };

  const handleCompanyClick = (company: Company) => {
    // If it's the back button, go back to company groups
    if (company.isBack) {
      setShowCompanies(false);
      setShowCompanyGroups(true);
      return;
    }

    // Handle individual company selection
    console.log("Compañía seleccionada:", company.id);
    onSelect(company.id);
  };

  const handleParticipanteSelect = (id: number) => {
    setSelectedParticipanteId(id);
    // Navigate to registro page with the selected ID
    closeMenu();
    setTimeout(() => {
      router.push(`/registro/${id}`);
    }, 300);
  };

  const handleParticipanteClear = () => {
    setSelectedParticipanteId(null);
  };

  const handleClick = (optionIndex?: number) => {
    if (optionIndex !== undefined || activeIndex !== null) {
      const selectedIndex =
        optionIndex !== undefined ? optionIndex : activeIndex;

      // Crear una nueva timeline para la animación de selección
      const selectTl = gsap.timeline({
        onComplete: () => {
          onSelect(options[selectedIndex!].id);
        },
      });

      // Animar la opción seleccionada
      selectTl.to(
        optionsRef.current[selectedIndex!],
        {
          scale: 1.5,
          opacity: 0,
          duration: 0.4,
          ease: "back.in(1.7)",
        },
        0
      );

      // Animar las otras opciones
      optionsRef.current.forEach((ref, i) => {
        if (i !== selectedIndex && ref) {
          selectTl.to(
            ref,
            {
              scale: 0,
              opacity: 0,
              duration: 0.3,
              ease: "back.in(1.7)",
            },
            i < selectedIndex! ? 0.05 : 0.1
          ); // Efecto secuencial basado en la posición
        }
      });

      // Animar el centro
      selectTl.to(
        centerRef.current,
        {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        0.15
      );

      // Animar el fondo
      selectTl.to(
        menuRef.current,
        {
          scale: 0.5,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        },
        0.25
      );

      // Animar el overlay
      selectTl.to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        0.3
      );
    } else {
      closeMenu();
    }
  };

  // Get the current companies to display based on active group
  const currentCompanies =
    activeGroupIndex !== null
      ? [...companyGroups[activeGroupIndex].companies, backOption]
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      {/* Overlay para atenuar el fondo */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
        style={{ pointerEvents: "auto" }}
        onClick={() => {
          if (showInput) {
            setShowInput(false);
          } else if (showCompanies) {
            setShowCompanies(false);
            setShowCompanyGroups(true);
          } else if (showCompanyGroups) {
            setShowCompanyGroups(false);
          } else {
            closeMenu();
          }
        }}
      />

      <div
        ref={menuRef}
        className="absolute bg-black/25 rounded-full w-[300px] h-[300px] flex items-center justify-center z-20"
        style={{
          left: position.x - 150,
          top: position.y - 150,
          pointerEvents: "auto",
        }}
        onClick={() =>
          !isMobile &&
          !showInput &&
          !showCompanyGroups &&
          !showCompanies &&
          handleClick()
        }
      >
        {/* Center circle/input container */}
        <div
          ref={centerRef}
          className={cn(
            "absolute flex items-center justify-center z-10 transition-colors",
            showInput ? "bg-white" : "bg-slate-800/90 w-20 h-20 rounded-full"
          )}
          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
        >
          {showInput ? (
            <div
              ref={inputContainerRef}
              className="w-full px-3"
              onClick={(e) => e.stopPropagation()}
            >
              <AutocompleteInput
                suggestions={participantes}
                onSelect={handleParticipanteSelect}
                onClear={handleParticipanteClear}
                placeholder="Buscar participante"
                dark={false}
                inputClassName="w-full h-10 px-4 text-sm rounded bg-transparent text-slate-800 placeholder-slate-500 border-none focus:outline-none focus:ring-0"
              />
            </div>
          ) : (
            <span className="text-white text-sm font-medium">
              {showCompanyGroups || showCompanies
                ? "Compañia"
                : activeIndex !== null
                ? options[activeIndex].label
                : "Opciones"}
            </span>
          )}
        </div>

        {/* Menu options */}
        {options.map((option, index) => {
          // Calculate position in the circle
          const angle = index * (360 / options.length) * (Math.PI / 180);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const isActive = index === activeIndex;
          const Icon = iconMap[option.icon];

          return (
            <div
              key={option.id}
              ref={(el) => {
                optionsRef.current[index] = el;
              }}
              className={cn(
                "absolute w-16 h-16 rounded-full flex items-center justify-center",
                isActive ? "bg-slate-700 shadow-lg" : "bg-slate-800/80",
                isMobile ? "active:bg-slate-600" : ""
              )}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isMobile) {
                  if (isActive) {
                    if (option.id === "person") {
                      setShowInput(true);
                      setShowCompanyGroups(false);
                      setShowCompanies(false);
                    } else if (option.id === "companies") {
                      setShowCompanyGroups(true);
                      setShowInput(false);
                      setShowCompanies(false);
                    } else {
                      handleOptionClick(index, e);
                    }
                  } else {
                    handleOptionClick(index, e);
                  }
                } else {
                  handleOptionClick(index, e);
                }
              }}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isActive ? "text-white" : "text-slate-300"
                  )}
                />
              )}
            </div>
          );
        })}

        {/* Company Groups */}
        {companyGroups.map((group, index) => {
          // Calculate position in the circle
          const angle = index * (360 / companyGroups.length) * (Math.PI / 180);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={group.id}
              ref={(el) => {
                companyGroupsRef.current[index] = el;
              }}
              className="absolute w-16 h-16 rounded-full flex flex-col items-center justify-center bg-slate-800/80 hover:bg-slate-700 cursor-pointer opacity-0 scale-0"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleCompanyGroupClick(index);
              }}
            >
              <span className="text-white font-bold text-sm">C</span>
              <span className="text-slate-300 text-xs">{group.range}</span>
            </div>
          );
        })}

        {/* Individual Companies */}
        {currentCompanies.map((company, index) => {
          // Calculate position in the circle
          const angle =
            index * (360 / currentCompanies.length) * (Math.PI / 180);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={company.id}
              ref={(el) => {
                companiesRef.current[index] = el;
              }}
              className={cn(
                "absolute w-16 h-16 rounded-full flex items-center justify-center opacity-0 scale-0 cursor-pointer",
                company.isBack
                  ? "bg-slate-700/90 hover:bg-slate-600"
                  : "bg-slate-800/80 hover:bg-slate-700"
              )}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleCompanyClick(company);
              }}
            >
              {company.isBack ? (
                <div className="flex flex-col items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                  <span className="text-white text-xs mt-1">
                    {company.name}
                  </span>
                </div>
              ) : (
                <span className="text-white font-medium">{company.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
