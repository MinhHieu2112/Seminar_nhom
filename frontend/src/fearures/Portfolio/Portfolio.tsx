import React, { useState, useEffect } from 'react';
import { Project } from '../../types/types';
// import { api } from '../../../api';
import { Maximize2, MapPin, Calendar, ArrowRight, Loader2, X, ChevronLeft, ChevronRight, Ruler } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Slider state
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.projects.getAll();
        setProjects(data);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const openDetail = (project: Project) => {
    setSelectedProject(project);
    setActiveImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeDetail = () => {
    setSelectedProject(null);
    document.body.style.overflow = 'auto';
  };

  const nextProject = () => {
    setCurrentProjectIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentProjectIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-200" size={40} />
    </div>
  );

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* Portfolio Hero Banner */}
      <section className="relative h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden mx-4 md:mx-8 my-8 rounded-[3rem] md:rounded-[5rem] shadow-2xl">
        <img 
          src="public/portfolio/the-regal.jpg" 
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns scale-110 opacity-70"
          alt="Architectural Showcase"
        />
        <div className="absolute inset-0 bg-black/45"></div>
        <div className="relative text-center max-w-7xl mx-4 animate-fade-in-up">
           <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.6em] text-white/50 mb-6 md:mb-10 block">Project Showcase</span>
           <h1 className="text-3xl md:text-5xl lg:text-7xl font-normal tracking-[0.15em] leading-none text-white uppercase mb-8 md:mb-12">DỰ ÁN TIÊU BIỂU</h1>
           <p className="text-white/80 max-w-2xl mx-auto font-light text-xs md:text-xl leading-[2.2] tracking-wide px-4">
            Kiệt tác kiến trúc được thực thi bởi tư duy thẩm mỹ đương đại và tay nghề tinh xảo hàng đầu.
          </p>
        </div>
      </section>

      {/* Main Project Slider Section */}
      <section className="max-w-[100vw] overflow-hidden py-16 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-300 mb-4 block">Excellence in Motion</span>
            <h2 className="text-3xl md:text-5xl font-normal tracking-tight uppercase">Khám phá các dự án</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={prevProject}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500 group shadow-sm"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={nextProject}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500 group shadow-sm"
            >
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Slider Track */}
        <div className="relative">
          <div 
            className="flex transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{ transform: `translateX(-${currentProjectIndex * 100}%)` }}
          >
            {projects.map((project, index) => (
              <div key={project.id} className="w-full flex-shrink-0 px-4 md:px-0">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 items-center">
                  
                  {/* Project Image Container */}
                  <div 
                    className="w-full lg:w-3/5 group relative overflow-hidden rounded-[3rem] md:rounded-[4rem] shadow-2xl bg-gray-50 cursor-pointer"
                    onClick={() => openDetail(project)}
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                       <img 
                        src={project.images[0]} 
                        alt={project.name} 
                        className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px] duration-700">
                      <div className="bg-white text-black p-6 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-all duration-700">
                        <Maximize2 size={28} />
                      </div>
                    </div>
                    <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 glass-effect bg-white/20 backdrop-blur-md px-6 md:px-8 py-2 md:py-3 rounded-full border border-white/30 text-white text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase">
                       {project.style}
                    </div>
                  </div>

                  {/* Project Info Container */}
                  <div className="w-full lg:w-2/5 px-4 lg:px-0 text-center lg:text-left">
                    <div className="mb-6 flex items-center justify-center lg:justify-start space-x-4">
                      <span className="h-[1px] w-12 bg-gray-200 hidden lg:block"></span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-300">0{index + 1} / 0{projects.length}</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-normal mb-8 tracking-tight uppercase leading-tight line-clamp-2">{project.name}</h2>
                    <p className="text-gray-500 mb-10 font-light leading-[2.2] text-sm md:text-lg tracking-wide line-clamp-3">{project.description}</p>
                    
                    <div className="grid grid-cols-2 gap-y-6 md:gap-y-8 mb-10 md:mb-12 border-t border-gray-100 pt-8 md:pt-12">
                      <div className="flex items-center text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider justify-center lg:justify-start">
                        <MapPin size={18} className="mr-3 text-gray-300" strokeWidth={1.5} />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider justify-center lg:justify-start">
                        <Calendar size={18} className="mr-3 text-gray-300" strokeWidth={1.5} />
                        <span>{project.completed_year}</span>
                      </div>
                      <div className="flex items-center text-[10px] md:text-xs font-semibold text-gray-600 col-span-2 tracking-wider justify-center lg:justify-start">
                        <div className="w-5 h-5 mr-3 bg-black text-white flex items-center justify-center text-[8px] font-bold rounded-full flex-shrink-0">m²</div>
                        <span>Diện tích: {project.area}m²</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDetail(project)}
                      className="group relative inline-flex items-center space-x-6 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all"
                    >
                      <span className="relative z-10">Khám phá chi tiết</span>
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                      <ArrowRight size={18} className="group-hover:translate-x-4 transition-transform duration-700" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-12 md:mt-20 space-x-3">
          {projects.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentProjectIndex(idx)}
              className={`h-1.5 transition-all duration-700 rounded-full ${currentProjectIndex === idx ? 'w-12 bg-black' : 'w-4 bg-gray-200'}`}
            />
          ))}
        </div>
      </section>

      {/* Bottom Contact CTA */}
      <div className="max-w-7xl mx-auto px-4 pb-32">
        <div className="bg-black text-white rounded-[3rem] md:rounded-[5rem] p-12 md:p-32 text-center overflow-hidden relative group shadow-2xl">
           <img 
            src="https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&q=80&w=2000" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-[10s] animate-ken-burns" 
            alt="Contact Banner" 
          />
           <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30"></div>
           <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-normal tracking-[0.15em] leading-none uppercase mb-8 md:mb-12">HỢP TÁC CÙNG LUXDECOR?</h2>
              <p className="text-white/80 max-w-3xl mx-auto font-light mb-12 md:mb-16 text-xs md:text-xl leading-[2.2] tracking-wide px-4">
                Để tầm nhìn của bạn được thực thi bởi đội ngũ chuyên gia hàng đầu. Hãy cùng chúng tôi tạo nên những không gian sống đầy cảm hứng.
              </p>
              <Link to="/services" className="inline-block bg-white text-black px-12 md:px-16 py-4 md:py-6 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:scale-110 transition-transform active:scale-95 shadow-2xl">Gửi yêu cầu ngay</Link>
           </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={closeDetail}></div>
          
          <div className="relative bg-white w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            {/* Close Button */}
            <button 
              onClick={closeDetail}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] p-3 md:p-4 bg-black/10 hover:bg-black text-black hover:text-white rounded-full transition-all backdrop-blur-md"
            >
              {/* Fix: Removed invalid md:size prop (Line 212) */}
              <X size={24} />
            </button>

            {/* Image Gallery Side */}
            <div className="w-full md:w-3/5 h-[40vh] md:h-auto relative bg-gray-50 flex flex-col">
              <div className="flex-grow relative overflow-hidden">
                <img 
                  src={`${selectedProject.images[activeImageIndex]}?auto=format&fit=crop&q=90&w=1600`}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover animate-in fade-in duration-700"
                />
                
                {selectedProject.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length)}
                      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/20"
                    >
                      {/* Fix: Removed invalid md:size prop (Line 230) */}
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % selectedProject.images.length)}
                      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/20"
                    >
                      {/* Fix: Removed invalid md:size prop (Line 236) */}
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              
              <div className="p-4 md:p-8 flex gap-4 overflow-x-auto bg-white/50 backdrop-blur-sm border-t border-gray-100">
                {selectedProject.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-black scale-105' : 'border-transparent opacity-50'}`}
                  >
                    <img src={`${img}?auto=format&fit=crop&q=60&w=300`} className="w-full h-full object-cover" alt="thumb" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content Side */}
            <div className="w-full md:w-2/5 p-8 md:p-16 overflow-y-auto bg-white">
              <div className="mb-8 md:mb-10">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300 mb-4 md:mb-6 block">Project Detail</span>
                <h2 className="text-2xl md:text-4xl font-normal tracking-tight uppercase leading-tight mb-6 md:mb-8">{selectedProject.name}</h2>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <span className="bg-black text-white px-4 md:px-5 py-2 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{selectedProject.style}</span>
                  <span className="bg-gray-50 border border-gray-100 text-gray-400 px-4 md:px-5 py-2 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{selectedProject.completed_year}</span>
                </div>
              </div>

              <div className="prose prose-sm mb-10 md:mb-12">
                <p className="text-gray-500 font-light leading-[2] md:leading-[2.2] text-xs md:text-base tracking-wide">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 md:gap-8 border-y border-gray-100 py-8 md:py-10 mb-10 md:mb-12">
                <div className="space-y-1">
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-300">Vị trí</p>
                  <div className="flex items-center text-[10px] md:text-xs font-bold text-gray-700">
                    <MapPin size={14} className="mr-2 md:mr-3 text-gray-400" />
                    {selectedProject.location}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-300">Diện tích</p>
                  <div className="flex items-center text-[10px] md:text-xs font-bold text-gray-700">
                    <Ruler size={14} className="mr-2 md:mr-3 text-gray-400" />
                    {selectedProject.area} m²
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { closeDetail(); navigate('/services'); }}
                className="w-full bg-black text-white py-4 md:py-5 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center space-x-3 md:space-x-4 hover:bg-gray-800 transition shadow-2xl"
              >
                <span>Tư vấn thiết kế tương tự</span>
                {/* Fix: Removed invalid md:size prop (Line 294) */}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;