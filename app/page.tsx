import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}

// export default function HomePage() {
//   return (
//     <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
//       <div className="grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        
//         {/* LEFT */}
//         <div className="flex flex-col gap-6">
//           <div className="space-y-4">
//             <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
//               SmartAccess
//             </span>

//             <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
//               Gestiona accesos de huéspedes{" "}
//               <span className="text-blue-600">sin llaves</span>
//             </h1>

//             <p className="text-base text-gray-600 md:text-lg">
//               Automatiza check-ins, genera códigos de acceso y elimina la
//               fricción operativa en tus apartamentos turísticos.
//             </p>
//           </div>

//           <div className="flex items-center gap-4">
//             <Link
//               href="/bookings"
//               className="btn btn-primary px-6 py-3 text-base"
//             >
//               Acceder
//             </Link>

//             <span className="text-sm text-gray-500">
//               MVP • Gestión de reservas y accesos
//             </span>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div className="relative">
//           <div className="rounded-2xl border bg-white p-6 shadow-md">
//             <div className="flex flex-col gap-4">
              
//               <div className="rounded-xl border p-4">
//                 <div className="text-sm font-semibold">Booking CONFIRMED</div>
//                 <div className="text-xs text-gray-500">
//                   Código generado automáticamente
//                 </div>
//               </div>

//               <div className="rounded-xl border p-4">
//                 <div className="text-sm font-semibold text-green-600">
//                   Access Code SENT
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   Enviado al huésped
//                 </div>
//               </div>

//               <div className="rounded-xl border p-4">
//                 <div className="text-sm font-semibold text-blue-600">
//                   Access ACTIVE
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   Válido durante la estancia
//                 </div>
//               </div>

//             </div>
//           </div>

//           {/* glow effect */}
//           <div className="absolute -z-10 h-full w-full rounded-3xl bg-gradient-to-r from-blue-200 to-indigo-200 blur-3xl opacity-40" />
//         </div>
//       </div>
//     </div>
//   );
// }