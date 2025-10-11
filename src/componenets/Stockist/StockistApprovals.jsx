// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { apiUrl } from "../config/api";
// import { getCookie } from "../utils/cookies";
// import { useRef } from "react";

// export default function StockistApprovals() {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [processing, setProcessing] = useState({});

//   useEffect(() => {
//     let mounted = true;
//     const fetchRequests = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const token = getCookie("token");
//         const res = await axios.get(apiUrl("/api/purchasing-card/requests"), {
//           headers: token ? { Authorization: Bearer ${token} } : {},
//         });
//         // Defensive: filter out any requests where the current stockist has
//         // already approved (guards against backend mismatches or race).
//         let currentStockistId = null;
//         try {
//           const stored =
//             typeof window !== "undefined" ? localStorage.getItem("user") : null;
//           if (stored) {
//             const parsed = JSON.parse(stored || "null");
//             const user = parsed && parsed.user ? parsed.user : parsed;
//             currentStockistId =
//               user && (user._id || user.id || user.userId)
//                 ? user._id || user.id || user.userId
//                 : null;
//           }
//         } catch (e) {
//           currentStockistId = null;
//         }

//         let incoming = res.data.data || [];
//         if (currentStockistId) {
//           incoming = incoming.filter((req) => {
//             try {
//               if (!Array.isArray(req.approvals) || req.approvals.length === 0)
//                 return true;
//               return !req.approvals.some(
//                 (a) => String(a.stockist) === String(currentStockistId)
//               );
//             } catch (e) {
//               return true;
//             }
//           });
//         }
//         if (mounted) setRequests(incoming);
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             err.message ||
//             "Failed to load requests"
//         );
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     // Initial fetch
//     fetchRequests();

//     // Start polling as a fallback so new requests appear even if SSE isn't available on the server
//     const intervalMs = 8000; // 8 seconds
//     const iv = setInterval(() => {
//       fetchRequests();
//     }, intervalMs);

//     // SSE: attempt to open server-sent events stream for real-time updates
//     let es = null;
//     try {
//       const token = getCookie("token");
//       if (token && typeof window !== "undefined" && window.EventSource) {
//         es = new EventSource(
//           apiUrl(/api/purchasing-card/stream?token=${token})
//         );
//         es.addEventListener("newRequest", (ev) => {
//           try {
//             const data = JSON.parse(ev.data);
//             // Defensive: if this client already approved the request, ignore
//             let currentStockistId = null;
//             try {
//               const stored = localStorage.getItem("user");
//               const parsed = stored ? JSON.parse(stored) : null;
//               const user = parsed && parsed.user ? parsed.user : parsed;
//               currentStockistId =
//                 user && (user._id || user.id || user.userId)
//                   ? user._id || user.id || user.userId
//                   : null;
//             } catch (e) {}

//             const alreadyApproved =
//               currentStockistId &&
//               Array.isArray(data.approvals) &&
//               data.approvals.some(
//                 (a) => String(a.stockist) === String(currentStockistId)
//               );
//             if (!alreadyApproved) {
//               setRequests((rs) => {
//                 // Avoid duplicates
//                 if (rs.some((r) => String(r._id) === String(data._id)))
//                   return rs;
//                 return [data, ...rs];
//               });
//             }
//           } catch (e) {
//             console.warn("Failed to parse SSE newRequest", e);
//           }
//         });
//         es.onerror = (e) => {
//           // silently close on error; fallback polling remains
//           try {
//             es.close();
//           } catch (e) {}
//         };
//       }
//     } catch (e) {
//       es = null;
//     }

//     return () => {
//       mounted = false;
//       try {
//         if (es) es.close();
//       } catch (e) {}
//       clearInterval(iv);
//     };
//   }, []);

//   const approve = async (id) => {
//     try {
//       setProcessing((p) => ({ ...p, [id]: true }));
//       const token = getCookie("token");
//       const res = await axios.post(
//         apiUrl(/api/purchasing-card/approve/${id}),
//         {},
//         { headers: token ? { Authorization: Bearer ${token} } : {} }
//       );
//       if (res.data && res.data.success) {
//         // Refresh list
//         setRequests((rs) => rs.filter((r) => String(r._id) !== String(id)));
//       }
//     } catch (err) {
//       alert(err.response?.data?.message || err.message || "Approval failed");
//     } finally {
//       setProcessing((p) => ({ ...p, [id]: false }));
//     }
//   };

//   const [selectedRequest, setSelectedRequest] = useState(null);

//   if (loading) return <div>Loading approval requests...</div>;
//   if (error) return <div className="text-red-600">{error}</div>;
//   if (!requests || requests.length === 0) return <div>No pending requests</div>;

//   return (
//     <div className="space-y-4">
//       {requests.map((r) => (
//         <div
//           key={r._id}
//           onClick={() => setSelectedRequest(r)}
//           className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between cursor-pointer"
//         >
//           <div className="flex items-center gap-3">
//             {r.requesterDisplay?.photo ? (
//               <img
//                 src={r.requesterDisplay.photo}
//                 alt="purchaser"
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//             ) : (
//               <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
//                 {(
//                   (
//                     r.requesterDisplay?.name ||
//                     r.requester?.medicalName ||
//                     r.requester?.email ||
//                     "?"
//                   )
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("") || "?"
//                 )
//                   .slice(0, 2)
//                   .toUpperCase()}
//               </div>
//             )}
//             <div>
//               <div className="font-semibold">
//                 {r.requesterDisplay?.name ||
//                   r.requester?.medicalName ||
//                   r.requester?.email ||
//                   "Unknown"}
//               </div>
//               <div className="text-sm text-gray-500">
//                 Requested on: {new Date(r.createdAt).toLocaleString()}
//               </div>
//               <div className="text-sm text-gray-600">Request ID: {r._id}</div>
//             </div>
//           </div>
//           <div>
//             <button
//               onClick={() => approve(r._id)}
//               disabled={processing[r._id]}
//               className="px-4 py-2 bg-teal-500 text-white rounded-lg"
//             >
//               {processing[r._id] ? "Approving..." : "Approve"}
//             </button>
//           </div>
//         </div>
//       ))}
//       {selectedRequest && (
//         <div
//           className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
//           onClick={() => setSelectedRequest(null)}
//         >
//           <div
//             className="bg-white rounded-lg p-6 max-w-md w-full"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center gap-4">
//               {selectedRequest.requesterDisplay?.photo ? (
//                 <img
//                   src={selectedRequest.requesterDisplay.photo}
//                   className="w-20 h-20 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
//                   {(
//                     selectedRequest.requesterDisplay?.name ||
//                     selectedRequest.requester?.medicalName ||
//                     "?"
//                   )
//                     .slice(0, 2)
//                     .toUpperCase()}
//                 </div>
//               )}
//               <div>
//                 <div className="font-bold text-lg">
//                   {selectedRequest.requesterDisplay?.name ||
//                     selectedRequest.requester?.medicalName}
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   ID: {selectedRequest._id}
//                 </div>
//               </div>
//             </div>
//             <div className="mt-4">
//               <p className="text-sm">
//                 Requested on:{" "}
//                 {new Date(selectedRequest.createdAt).toLocaleString()}
//               </p>
//               <p className="text-sm mt-2">
//                 Approvals: {(selectedRequest.approvals || []).length}
//               </p>
//             </div>
//             <div className="mt-4 flex justify-end">
//               <button
//                 onClick={() => {
//                   approve(selectedRequest._id);
//                   setSelectedRequest(null);
//                 }}
//                 className="px-4 py-2 bg-teal-500 text-white rounded"
//               >
//                 Approve
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import { apiUrl } from "../config/api";
// import { getCookie } from "../utils/cookies";

// // Modal component (memoized to prevent unnecessary re-renders)
// const RequestModal = React.memo(({ request, onClose, onApprove }) => {
//   if (!request) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-lg p-6 max-w-md w-full"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center gap-4">
//           {request.requesterDisplay?.photo ? (
//             <img
//               src={request.requesterDisplay.photo}
//               className="w-20 h-20 rounded-full object-cover"
//             />
//           ) : (
//             <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
//               {(request.requesterDisplay?.name || request.requester?.medicalName || "?")
//                 .slice(0, 2)
//                 .toUpperCase()}
//             </div>
//           )}
//           <div>
//             <div className="font-bold text-lg">
//               {request.requesterDisplay?.name || request.requester?.medicalName}
//             </div>
//             <div className="text-sm text-gray-500">ID: {request._id}</div>
//           </div>
//         </div>
//         <div className="mt-4">
//           <p className="text-sm">
//             Requested on: {new Date(request.createdAt).toLocaleString()}
//           </p>
//           <p className="text-sm mt-2">Approvals: {(request.approvals || []).length}</p>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={() => {
//               onApprove(request._id);
//               onClose();
//             }}
//             className="px-4 py-2 bg-teal-500 text-white rounded"
//           >
//             Approve
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default function StockistApprovals() {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [processing, setProcessing] = useState({});
//   const [selectedRequest, setSelectedRequest] = useState(null);

//   // Approve function
//   const approve = useCallback(async (id) => {
//     try {
//       setProcessing((p) => ({ ...p, [id]: true }));
//       const token = getCookie("token");
//       const res = await axios.post(
//         apiUrl(/api/purchasing-card/approve/${id}),
//         {},
//         { headers: token ? { Authorization: Bearer ${token} } : {} }
//       );
//       if (res.data?.success) {
//         setRequests((rs) => rs.filter((r) => String(r._id) !== String(id)));
//       }
//     } catch (err) {
//       alert(err.response?.data?.message || err.message || "Approval failed");
//     } finally {
//       setProcessing((p) => ({ ...p, [id]: false }));
//     }
//   }, []);

//   // Fetch requests
//   useEffect(() => {
//     let mounted = true;

//     const fetchRequests = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const token = getCookie("token");
//         const res = await axios.get(apiUrl("/api/purchasing-card/requests"), {
//           headers: token ? { Authorization: Bearer ${token} } : {},
//         });

//         // Get current stockist ID
//         let currentStockistId = null;
//         try {
//           const stored = localStorage.getItem("user");
//           if (stored) {
//             const parsed = JSON.parse(stored || "null");
//             const user = parsed && parsed.user ? parsed.user : parsed;
//             currentStockistId =
//               user && (user._id || user.id || user.userId)
//                 ? user._id || user.id || user.userId
//                 : null;
//           }
//         } catch (e) {
//           currentStockistId = null;
//         }

//         // Filter requests this stockist has already approved
//         let incoming = res.data.data || [];
//         if (currentStockistId) {
//           incoming = incoming.filter((req) => {
//             try {
//               if (!Array.isArray(req.approvals) || req.approvals.length === 0)
//                 return true;
//               return !req.approvals.some(
//                 (a) => String(a.stockist) === String(currentStockistId)
//               );
//             } catch (e) {
//               return true;
//             }
//           });
//         }

//        if (mounted) {
//   setRequests((prev) => {
//     const prevIds = prev.map((r) => r._id).sort().join(",");
//     const incomingIds = incoming.map((r) => r._id).sort().join(",");
//     if (prevIds !== incomingIds) return incoming; // only update if different
//     return prev; // no change, no rerender
//   });
// }
//       } catch (err) {
//         setError(err.response?.data?.message || err.message || "Failed to load requests");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     // Initial fetch
//     fetchRequests();

//   const iv = setInterval(() => {
//   if (!selectedRequest) fetchRequests(); // only fetch if modal closed
// }, intervalMs);

//     // SSE
//     let es = null;
//     try {
//       const token = getCookie("token");
//       if (token && typeof window !== "undefined" && window.EventSource) {
//         es = new EventSource(apiUrl(/api/purchasing-card/stream?token=${token}));
//         es.addEventListener("newRequest", (ev) => {
//           try {
//             const data = JSON.parse(ev.data);

//             // Get current stockist ID
//             let currentStockistId = null;
//             try {
//               const stored = localStorage.getItem("user");
//               const parsed = stored ? JSON.parse(stored) : null;
//               const user = parsed && parsed.user ? parsed.user : parsed;
//               currentStockistId =
//                 user && (user._id || user.id || user.userId)
//                   ? user._id || user.id || user.userId
//                   : null;
//             } catch (e) {}

//             const alreadyApproved =
//               currentStockistId &&
//               Array.isArray(data.approvals) &&
//               data.approvals.some(
//                 (a) => String(a.stockist) === String(currentStockistId)
//               );
//             if (!alreadyApproved) {
//               setRequests((rs) => {
//                 if (rs.some((r) => String(r._id) === String(data._id))) return rs;
//                 return [data, ...rs];
//               });
//             }
//           } catch (e) {
//             console.warn("Failed to parse SSE newRequest", e);
//           }
//         });
//         es.onerror = () => {
//           try {
//             es.close();
//           } catch (e) {}
//         };
//       }
//     } catch (e) {
//       es = null;
//     }

//     return () => {
//       mounted = false;
//       clearInterval(iv);
//       if (es) try { es.close(); } catch {}
//     };
//   }, []);

//   if (loading) return <div>Loading approval requests...</div>;
//   if (error) return <div className="text-red-600">{error}</div>;
//   if (!requests || requests.length === 0) return <div>No pending requests</div>;

//   return (
//     <div className="space-y-4">
//       {requests.map((r) => (
//         <div
//           key={r._id}
//           onClick={() => setSelectedRequest(r)}
//           className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between cursor-pointer"
//         >
//           <div className="flex items-center gap-3">
//             {r.requesterDisplay?.photo ? (
//               <img
//                 src={r.requesterDisplay.photo}
//                 alt="purchaser"
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//             ) : (
//               <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
//                 {(
//                   (r.requesterDisplay?.name || r.requester?.medicalName || r.requester?.email || "?")
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("") || "?"
//                 )
//                   .slice(0, 2)
//                   .toUpperCase()}
//               </div>
//             )}
//             <div>
//               <div className="font-semibold">
//                 {r.requesterDisplay?.name || r.requester?.medicalName || r.requester?.email || "Unknown"}
//               </div>
//               <div className="text-sm text-gray-500">
//                 Requested on: {new Date(r.createdAt).toLocaleString()}
//               </div>
//               <div className="text-sm text-gray-600">Request ID: {r._id}</div>
//             </div>
//           </div>
//           <div>
//             <button
//               onClick={() => approve(r._id)}
//               disabled={processing[r._id]}
//               className="px-4 py-2 bg-teal-500 text-white rounded-lg"
//             >
//               {processing[r._id] ? "Approving..." : "Approve"}
//             </button>
//           </div>
//         </div>
//       ))}

//       <RequestModal
//         request={selectedRequest}
//         onClose={() => setSelectedRequest(null)}
//         onApprove={approve}
//       />
//     </div>
//   );
// }
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";

// ✅ Modal component (memoized to prevent unnecessary re-renders)
const RequestModal = React.memo(({ request, onClose, onApprove }) => {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          {request.requesterDisplay?.photo ? (
            <img
              src={request.requesterDisplay.photo}
              className="w-20 h-20 rounded-full object-cover"
              alt="Requester"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
              {(
                request.requesterDisplay?.name ||
                request.requester?.medicalName ||
                "?"
              )
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-lg">
              {request.requesterDisplay?.name || request.requester?.medicalName}
            </div>
            <div className="text-sm text-gray-500">ID: {request._id}</div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm">
            Requested on: {new Date(request.createdAt).toLocaleString()}
          </p>
          <p className="text-sm mt-2">
            Approvals: {(request.approvals || []).length}
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              onApprove(request._id);
              onClose();
            }}
            className="px-4 py-2 bg-teal-500 text-white rounded"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
});

export default function StockistApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ✅ Approve function
  const approve = useCallback(async (id) => {
    try {
      setProcessing((p) => ({ ...p, [id]: true }));
      const token = getCookie("token");

      const res = await axios.post(
        apiUrl(`/api/purchasing-card/approve/${id}`),
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        setRequests((rs) => rs.filter((r) => String(r._id) !== String(id)));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Approval failed");
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }, []);

  // ✅ Fetch requests once on mount
  useEffect(() => {
    let mounted = true;

    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie("token");
        const res = await axios.get(apiUrl("/api/purchasing-card/requests"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // ✅ Get current stockist ID
        let currentStockistId = null;
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored || "null");
            const user = parsed && parsed.user ? parsed.user : parsed;
            currentStockistId =
              user && (user._id || user.id || user.userId)
                ? user._id || user.id || user.userId
                : null;
          }
        } catch (e) {
          currentStockistId = null;
        }

        // ✅ Filter requests this stockist has already approved
        let incoming = res.data.data || [];
        if (currentStockistId) {
          incoming = incoming.filter((req) => {
            try {
              if (!Array.isArray(req.approvals) || req.approvals.length === 0)
                return true;
              return !req.approvals.some(
                (a) => String(a.stockist) === String(currentStockistId)
              );
            } catch (e) {
              return true;
            }
          });
        }

        if (mounted) setRequests(incoming);
      } catch (err) {
        if (mounted)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load requests"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRequests();

    // ✅ SSE for real-time updates
    let es = null;
    try {
      const token = getCookie("token");
      if (token && typeof window !== "undefined" && window.EventSource) {
        es = new EventSource(
          apiUrl(`/api/purchasing-card/stream?token=${token}`)
        );

        es.addEventListener("newRequest", (ev) => {
          try {
            const data = JSON.parse(ev.data);

            let currentStockistId = null;
            try {
              const stored = localStorage.getItem("user");
              const parsed = stored ? JSON.parse(stored) : null;
              const user = parsed && parsed.user ? parsed.user : parsed;
              currentStockistId =
                user && (user._id || user.id || user.userId)
                  ? user._id || user.id || user.userId
                  : null;
            } catch (e) {}

            const alreadyApproved =
              currentStockistId &&
              Array.isArray(data.approvals) &&
              data.approvals.some(
                (a) => String(a.stockist) === String(currentStockistId)
              );

            if (!alreadyApproved) {
              setRequests((rs) => {
                if (rs.some((r) => String(r._id) === String(data._id)))
                  return rs;
                return [data, ...rs];
              });
            }
          } catch (e) {
            console.warn("Failed to parse SSE newRequest", e);
          }
        });

        es.onerror = () => {
          try {
            es.close();
          } catch {}
        };
      }
    } catch (e) {
      es = null;
    }

    return () => {
      mounted = false;
      if (es)
        try {
          es.close();
        } catch {}
    };
  }, []);

  if (loading) return <div>Loading approval requests...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!requests || requests.length === 0) return <div>No pending requests</div>;

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div
          key={r._id}
          onClick={() => setSelectedRequest(r)}
          className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {r.requesterDisplay?.photo ? (
              <img
                src={r.requesterDisplay.photo}
                alt="purchaser"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                {(
                  (
                    r.requesterDisplay?.name ||
                    r.requester?.medicalName ||
                    r.requester?.email ||
                    "?"
                  )
                    .split(" ")
                    .map((n) => n[0])
                    .join("") || "?"
                )
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold">
                {r.requesterDisplay?.name ||
                  r.requester?.medicalName ||
                  r.requester?.email ||
                  "Unknown"}
              </div>
              <div className="text-sm text-gray-500">
                Requested on: {new Date(r.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Request ID: {r._id}</div>
            </div>
          </div>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                approve(r._id);
              }}
              disabled={processing[r._id]}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg"
            >
              {processing[r._id] ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      ))}

      <RequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={approve}
      />
    </div>
  );
}
