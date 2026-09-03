import { Session, PageVisit, TimelineEntry, MindMapNode, MindMapEdge } from '../types';

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'session-quantum-pharma',
    title: 'Quantum Algorithms in Molecular Drug Discovery',
    description: 'Investigating Variational Quantum Eigensolvers (VQE) and Quantum Phase Estimation (QPE) for simulating complex ligand-protein binding affinities.',
    status: 'ACTIVE',
    startTime: '2026-09-02T14:20:00.000Z',
    endTime: null,
    eventCount: 16,
    pageCount: 11,
    searchCount: 7,
    entityCount: 24,
    tags: ['Quantum Chemistry', 'Drug Design', 'VQE', 'Bioinformatics'],
    favorite: true
  },
  {
    id: 'session-neuromorphic-ai',
    title: 'Neuromorphic Computing & Spiking Neural Dynamics',
    description: 'Analysis of event-driven spiking architectures, memristive crossbar arrays, and sub-milliwatt inference models.',
    status: 'COMPLETED',
    startTime: '2026-08-28T09:15:00.000Z',
    endTime: '2026-08-30T18:45:00.000Z',
    eventCount: 12,
    pageCount: 8,
    searchCount: 5,
    entityCount: 18,
    tags: ['Neuromorphic', 'SNN', 'Hardware', 'Bio-inspired'],
    favorite: true
  },
  {
    id: 'session-agent-alignment',
    title: 'Autonomous Agent Alignment & Formal Verification',
    description: 'Synthesizing mechanistic interpretability methods with formal constraint solvers to verify multi-agent reasoning chains.',
    status: 'ACTIVE',
    startTime: '2026-09-03T11:00:00.000Z',
    endTime: null,
    eventCount: 9,
    pageCount: 7,
    searchCount: 4,
    entityCount: 15,
    tags: ['AI Safety', 'Formal Verification', 'Mechanistic Interp'],
    favorite: false
  },
  {
    id: 'session-crispr-base-edit',
    title: 'CRISPR Prime Editing & Epigenetic Modulators',
    description: 'Evaluating off-target cleavage mitigation in prime editing enzymes and lipid nanoparticle delivery vectors.',
    status: 'COMPLETED',
    startTime: '2026-08-20T08:30:00.000Z',
    endTime: '2026-08-22T16:00:00.000Z',
    eventCount: 8,
    pageCount: 6,
    searchCount: 3,
    entityCount: 14,
    tags: ['Genomics', 'CRISPR', 'Epigenetics'],
    favorite: false
  }
];

export const MOCK_GRAPH_DATA: Record<string, { nodes: MindMapNode[]; edges: MindMapEdge[] }> = {
  'session-quantum-pharma': {
    nodes: [
      {
        id: 'q-search-1',
        type: 'SEARCH',
        label: 'VQE Hamiltonian mapping for kinase inhibitors',
        timestamp: '2026-09-02T14:21:00.000Z',
        relevanceScore: 0.98,
        tags: ['Search Query', 'Quantum']
      },
      {
        id: 'q-concept-vqe',
        type: 'CONCEPT',
        label: 'Variational Quantum Eigensolver (VQE)',
        abstract: 'A hybrid quantum-classical algorithm used to find the ground state energy of a molecular Hamiltonian using parameterized quantum circuits.',
        relevanceScore: 0.96,
        tags: ['Algorithm', 'Hybrid Quantum']
      },
      {
        id: 'q-paper-nature-1',
        type: 'SOURCE_PAPER',
        label: 'Scalable electronic structure calculations on noisy quantum hardware',
        url: 'https://nature.com/articles/s41586-026-04921-x',
        domain: 'nature.com',
        authors: ['H. Kandala', 'A. Mezzacapo', 'K. Temme', 'J. M. Gambetta'],
        citationCount: 482,
        timestamp: '2026-09-02T14:26:00.000Z',
        abstract: 'We demonstrate hardware-efficient variational ansatzes that mitigate coherence decay in multi-qubit superconducting processors for molecular simulation.',
        relevanceScore: 0.94,
        insights: [
          'Reduces CNOT depth by 42% compared to Unitary Coupled Cluster (UCCSD)',
          'Error mitigation via zero-noise extrapolation achieves chemical accuracy for LiH and BeH2'
        ]
      },
      {
        id: 'q-paper-arxiv-1',
        type: 'SOURCE_PAPER',
        label: 'Quantum Phase Estimation bounds for KRAS-G12D transition state',
        url: 'https://arxiv.org/abs/2608.10492',
        domain: 'arxiv.org',
        authors: ['S. McArdle', 'E. Campbell', 'V. Aspuru-Guzik'],
        citationCount: 68,
        timestamp: '2026-09-02T14:40:00.000Z',
        abstract: 'Benchmarking fault-tolerant QPE resources required to resolve active-site catalytic barriers in oncogenic KRAS mutants with 1 milli-Hartree precision.',
        relevanceScore: 0.92,
        insights: [
          'Logical T-gate count estimated at 4.2 × 10^8 for 78 active orbital space',
          'Identifies active-site electron correlation bottlenecks impossible on classical DFT'
        ]
      },
      {
        id: 'q-ai-insight-1',
        type: 'AI_INSIGHT',
        label: 'Synthesis: Hybrid VQE-GFMC reduces T-depth by 3.8x',
        abstract: 'By combining variational ansatz initialization with auxiliary-field quantum Monte Carlo projection, qubit gate depth requirements drop below NISQ decoherence thresholds.',
        relevanceScore: 0.99,
        insights: [
          'Key bridge between NISQ limitations and fault-tolerant requirements',
          'Enables simulation of metalloenzyme active sites (e.g. cytochrome P450) without full fault-tolerance'
        ]
      },
      {
        id: 'q-page-biorxiv',
        type: 'PAGE',
        label: 'High-Throughput Cryo-EM and Binding Free Energy Maps',
        url: 'https://biorxiv.org/content/10.1101/2026.07.15.89201',
        domain: 'biorxiv.org',
        authors: ['D. Chen', 'M. Alvarez', 'L. Wei'],
        citationCount: 31,
        timestamp: '2026-09-02T15:10:00.000Z',
        abstract: 'Cryo-EM 1.8Å reconstructions of non-small cell lung cancer kinase dimers paired with empirical binding kinetics.',
        relevanceScore: 0.88
      },
      {
        id: 'q-concept-qpe',
        type: 'CONCEPT',
        label: 'Quantum Phase Estimation (QPE)',
        abstract: 'An eigenvalue estimation algorithm offering exponential speedup for ground and excited state energy estimation on fault-tolerant systems.',
        relevanceScore: 0.91,
        tags: ['Fault-Tolerant', 'Exact Quantum']
      },
      {
        id: 'q-domain-nature',
        type: 'DOMAIN',
        label: 'nature.com',
        domain: 'nature.com',
        metadata: { trustScore: 0.99, peerReviewed: true }
      },
      {
        id: 'q-domain-arxiv',
        type: 'DOMAIN',
        label: 'arxiv.org',
        domain: 'arxiv.org',
        metadata: { trustScore: 0.92, preprints: true }
      },
      {
        id: 'q-search-2',
        type: 'SEARCH',
        label: 'Active site orbital truncation for metalloenzymes',
        timestamp: '2026-09-02T15:35:00.000Z',
        relevanceScore: 0.89,
        tags: ['Search Query', 'Orbitals']
      },
      {
        id: 'q-paper-chem-rev',
        type: 'SOURCE_PAPER',
        label: 'Tensor network state compression for multi-reference bio-molecules',
        url: 'https://pubs.acs.org/doi/10.1021/acs.chemrev.6c0032',
        domain: 'acs.org',
        authors: ['G. Chan', 'R. Olivares-Amaya', 'M. Reiher'],
        citationCount: 914,
        timestamp: '2026-09-02T16:00:00.000Z',
        abstract: 'Density Matrix Renormalization Group (DMRG) and Tree Tensor Networks for active space selection prior to quantum circuit compilation.',
        relevanceScore: 0.95,
        insights: [
          'Automated CAS active orbital selection trims qubit register from 144 to 48',
          'Eliminates unentangled core states while preserving 99.7% dynamical correlation energy'
        ]
      },
      {
        id: 'q-ai-insight-2',
        type: 'AI_INSIGHT',
        label: 'Contradiction: Classical DMRG surpasses NISQ VQE for 1D ligands',
        abstract: 'For elongated, quasi-1D molecular topologies, Matrix Product States on classical GPUs achieve superior fidelity at 1/1000th the noise rate of physical superconducting qubits.',
        relevanceScore: 0.93,
        insights: [
          'NISQ VQE advantage is strictly restricted to highly 2D/3D entangled transition metals',
          'Recommends benchmark partitioning based on entanglement entropy metrics'
        ]
      },
      {
        id: 'q-concept-entanglement',
        type: 'CONCEPT',
        label: 'Molecular Orbital Entanglement Entropy',
        abstract: 'Quantifies quantum correlation between single-particle orbitals to determine optimal quantum vs classical routing.',
        relevanceScore: 0.87
      }
    ],
    edges: [
      {
        id: 'e-q-1',
        source: 'q-search-1',
        target: 'q-concept-vqe',
        relationship: 'EXPLORES',
        description: 'Primary algorithmic formulation queried'
      },
      {
        id: 'e-q-2',
        source: 'q-concept-vqe',
        target: 'q-paper-nature-1',
        relationship: 'DERIVED_FROM',
        description: 'Hardware implementation baseline'
      },
      {
        id: 'e-q-3',
        source: 'q-paper-nature-1',
        target: 'q-domain-nature',
        relationship: 'CITES',
        description: 'Published in peer-reviewed domain'
      },
      {
        id: 'e-q-4',
        source: 'q-search-1',
        target: 'q-paper-arxiv-1',
        relationship: 'EXPLORES',
        description: 'Direct search retrieval on KRAS target'
      },
      {
        id: 'e-q-5',
        source: 'q-paper-arxiv-1',
        target: 'q-concept-qpe',
        relationship: 'DERIVED_FROM',
        description: 'Utilizes fault-tolerant phase estimation'
      },
      {
        id: 'e-q-6',
        source: 'q-paper-arxiv-1',
        target: 'q-domain-arxiv',
        relationship: 'CITES',
        description: 'Preprint archive'
      },
      {
        id: 'e-q-7',
        source: 'q-paper-nature-1',
        target: 'q-ai-insight-1',
        relationship: 'SUPPORTS',
        description: 'Forms the basis for hybrid hardware extrapolation'
      },
      {
        id: 'e-q-8',
        source: 'q-paper-arxiv-1',
        target: 'q-ai-insight-1',
        relationship: 'SUPPORTS',
        description: 'Provides exact target Hamiltonian bounds'
      },
      {
        id: 'e-q-9',
        source: 'q-search-2',
        target: 'q-paper-chem-rev',
        relationship: 'EXPLORES',
        description: 'Query for tensor network orbital reduction'
      },
      {
        id: 'e-q-10',
        source: 'q-paper-chem-rev',
        target: 'q-concept-entanglement',
        relationship: 'DERIVED_FROM',
        description: 'Uses entanglement metrics for orbital ranking'
      },
      {
        id: 'e-q-11',
        source: 'q-paper-chem-rev',
        target: 'q-ai-insight-2',
        relationship: 'CONTRADICTS',
        description: 'Proves classical tensor methods beat NISQ for 1D systems'
      },
      {
        id: 'e-q-12',
        source: 'q-page-biorxiv',
        target: 'q-paper-arxiv-1',
        relationship: 'RELATED_TO',
        description: 'Supplies experimental Cryo-EM structure coordinates'
      }
    ]
  },
  'session-neuromorphic-ai': {
    nodes: [
      {
        id: 'n-search-1',
        type: 'SEARCH',
        label: 'Event-driven spiking neural networks ultra-low power edge',
        timestamp: '2026-08-28T09:16:00.000Z',
        relevanceScore: 0.97
      },
      {
        id: 'n-concept-snn',
        type: 'CONCEPT',
        label: 'Spiking Neural Networks (SNN)',
        abstract: 'Third-generation neural networks that incorporate the concept of time and spike-based sparse asynchronous communication.',
        relevanceScore: 0.95
      },
      {
        id: 'n-paper-ieee-1',
        type: 'SOURCE_PAPER',
        label: 'Loihi 2: A 128-core asynchronous neuromorphic processor with programmable synaptic plasticity',
        url: 'https://ieeexplore.ieee.org/document/9658241',
        domain: 'ieee.org',
        authors: ['M. Davies', 'A. Wild', 'G. Orchard', 'Y. Sandamirskaya'],
        citationCount: 520,
        timestamp: '2026-08-28T09:30:00.000Z',
        abstract: 'Fabricated on Intel 4 process, Loihi 2 supports microcode-programmable neuron models with 10x spike rate improvements and 0.05 pJ/SOP energy efficiency.',
        relevanceScore: 0.98,
        insights: [
          'Resonant and graded-spike models reduce latency by 6x over binary LIF',
          'On-chip learning via three-factor STDP rules without host GPU overhead'
        ]
      },
      {
        id: 'n-paper-science-1',
        type: 'SOURCE_PAPER',
        label: 'Memristive crossbars for in-situ non-volatile synaptic matrix multiply',
        url: 'https://science.org/doi/10.1126/science.abj3942',
        domain: 'science.org',
        authors: ['Q. Xia', 'J. J. Yang', 'S. R. Forrest'],
        citationCount: 380,
        timestamp: '2026-08-28T10:15:00.000Z',
        abstract: 'Demonstrating analog vector-matrix multiplication at the speed of Ohm and Kirchhoff laws using hafnium oxide memristors.',
        relevanceScore: 0.94
      },
      {
        id: 'n-ai-insight-1',
        type: 'AI_INSIGHT',
        label: 'Synthesis: Hybrid Digital-Analog Neuromorphic Architectures',
        abstract: 'Pure analog memristor drift can be counteracted by digital event routers, achieving 1000x energy efficiency for streaming audio and sensor fusion.',
        relevanceScore: 0.96
      }
    ],
    edges: [
      { id: 'e-n-1', source: 'n-search-1', target: 'n-concept-snn', relationship: 'EXPLORES' },
      { id: 'e-n-2', source: 'n-concept-snn', target: 'n-paper-ieee-1', relationship: 'DERIVED_FROM' },
      { id: 'e-n-3', source: 'n-concept-snn', target: 'n-paper-science-1', relationship: 'RELATED_TO' },
      { id: 'e-n-4', source: 'n-paper-ieee-1', target: 'n-ai-insight-1', relationship: 'SUPPORTS' },
      { id: 'e-n-5', source: 'n-paper-science-1', target: 'n-ai-insight-1', relationship: 'SUPPORTS' }
    ]
  },
  'session-agent-alignment': {
    nodes: [
      {
        id: 'a-search-1',
        type: 'SEARCH',
        label: 'Mechanistic interpretability for multi-step reasoning models',
        timestamp: '2026-09-03T11:05:00.000Z',
        relevanceScore: 0.97
      },
      {
        id: 'a-concept-circuits',
        type: 'CONCEPT',
        label: 'Transformer Induction Heads & Circuit Tracing',
        abstract: 'Identifying specific attention head subgraphs responsible for in-context pattern copying and algorithmic task completion.',
        relevanceScore: 0.94
      },
      {
        id: 'a-paper-safety',
        type: 'SOURCE_PAPER',
        label: 'Sparse Autoencoders Find Monosemantic Features in Frontier Language Models',
        url: 'https://transformer-circuits.pub/2026/sae-monosemantic',
        domain: 'transformer-circuits.pub',
        authors: ['C. Olah', 'N. Nanda', 'A. Templeton', 'J. Batson'],
        citationCount: 410,
        timestamp: '2026-09-03T11:20:00.000Z',
        abstract: 'Scaling sparse dictionary learning to 16M latent features to decompose superposition and verify unfaithfulness in chain-of-thought activations.',
        relevanceScore: 0.99,
        insights: [
          'Discovered deceptive alignment triggers isolated to 3 specific latent dictionary features',
          'Allows targeted causal ablation without degrading benchmark performance'
        ]
      },
      {
        id: 'a-ai-insight-1',
        type: 'AI_INSIGHT',
        label: 'Synthesis: Automated Runtime Feature Clamping for Safety Gateways',
        abstract: 'By integrating sparse autoencoder activation detectors directly into inference filters, harmful reasoning pathways can be caught mid-generation before token output.',
        relevanceScore: 0.95
      }
    ],
    edges: [
      { id: 'e-a-1', source: 'a-search-1', target: 'a-concept-circuits', relationship: 'EXPLORES' },
      { id: 'e-a-2', source: 'a-concept-circuits', target: 'a-paper-safety', relationship: 'DERIVED_FROM' },
      { id: 'e-a-3', source: 'a-paper-safety', target: 'a-ai-insight-1', relationship: 'SUPPORTS' }
    ]
  },
  'session-crispr-base-edit': {
    nodes: [
      {
        id: 'c-search-1',
        type: 'SEARCH',
        label: 'Prime editing guide RNA optimization high efficiency',
        timestamp: '2026-08-20T08:35:00.000Z',
        relevanceScore: 0.96
      },
      {
        id: 'c-paper-nature',
        type: 'SOURCE_PAPER',
        label: 'Engineered pegRNAs with structured 3 prime motifs for high-yield precision editing',
        url: 'https://nature.com/articles/s41587-026-01290-7',
        domain: 'nature.com',
        authors: ['D. R. Liu', 'A. V. Anzalone', 'P. B. Chen'],
        citationCount: 345,
        timestamp: '2026-08-20T09:00:00.000Z',
        abstract: 'Incorporation of evopreQ1 and mpknot RNA pseudoknots protects pegRNA 3 prime extensions from exonuclease degradation.',
        relevanceScore: 0.97
      }
    ],
    edges: [
      { id: 'e-c-1', source: 'c-search-1', target: 'c-paper-nature', relationship: 'EXPLORES' }
    ]
  }
};

export const MOCK_PAGES: Record<string, PageVisit[]> = {
  'session-quantum-pharma': [
    {
      id: 'page-1',
      url: 'https://nature.com/articles/s41586-026-04921-x',
      domain: 'nature.com',
      title: 'Scalable electronic structure calculations on noisy quantum hardware',
      excerpt: 'Hardware-efficient variational ansatzes tailored for superconducting transmon qubits to compute molecular ground state energies with active error mitigation.',
      authors: ['H. Kandala', 'A. Mezzacapo', 'K. Temme', 'J. M. Gambetta'],
      publishedDate: '2026-03-12',
      citationCount: 482,
      firstVisited: '2026-09-02T14:26:00.000Z',
      lastVisited: '2026-09-02T16:15:00.000Z',
      visitCount: 6,
      durationMs: 420000,
      readingTimeMinutes: 14,
      sourceType: 'academic',
      reliabilityScore: 0.98,
      tags: ['Quantum Hardware', 'VQE', 'Peer Reviewed']
    },
    {
      id: 'page-2',
      url: 'https://arxiv.org/abs/2608.10492',
      domain: 'arxiv.org',
      title: 'Quantum Phase Estimation bounds for KRAS-G12D transition state',
      excerpt: 'Resource estimation for full configuration interaction (FCI) quantum phase estimation on fault-tolerant architectures targeting oncogenic KRAS drug binding.',
      authors: ['S. McArdle', 'E. Campbell', 'V. Aspuru-Guzik'],
      publishedDate: '2026-08-18',
      citationCount: 68,
      firstVisited: '2026-09-02T14:40:00.000Z',
      lastVisited: '2026-09-02T15:45:00.000Z',
      visitCount: 4,
      durationMs: 280000,
      readingTimeMinutes: 18,
      sourceType: 'preprint',
      reliabilityScore: 0.92,
      tags: ['Preprint', 'KRAS', 'QPE', 'Cancer Targets']
    },
    {
      id: 'page-3',
      url: 'https://pubs.acs.org/doi/10.1021/acs.chemrev.6c0032',
      domain: 'acs.org',
      title: 'Tensor network state compression for multi-reference bio-molecules',
      excerpt: 'Systematic benchmark of DMRG and Matrix Product States for orbital active space truncation in transition metal complexes.',
      authors: ['G. Chan', 'R. Olivares-Amaya', 'M. Reiher'],
      publishedDate: '2026-01-20',
      citationCount: 914,
      firstVisited: '2026-09-02T16:00:00.000Z',
      lastVisited: '2026-09-02T16:45:00.000Z',
      visitCount: 5,
      durationMs: 310000,
      readingTimeMinutes: 22,
      sourceType: 'academic',
      reliabilityScore: 0.99,
      tags: ['Tensor Networks', 'DMRG', 'ACS']
    },
    {
      id: 'page-4',
      url: 'https://biorxiv.org/content/10.1101/2026.07.15.89201',
      domain: 'biorxiv.org',
      title: 'High-Throughput Cryo-EM and Binding Free Energy Maps',
      excerpt: 'Sub-2 Angstrom resolution mapping of allosteric inhibitor binding pockets with kinetic rate measurements.',
      authors: ['D. Chen', 'M. Alvarez', 'L. Wei'],
      publishedDate: '2026-07-15',
      citationCount: 31,
      firstVisited: '2026-09-02T15:10:00.000Z',
      lastVisited: '2026-09-02T15:25:00.000Z',
      visitCount: 2,
      durationMs: 140000,
      readingTimeMinutes: 9,
      sourceType: 'preprint',
      reliabilityScore: 0.89,
      tags: ['Cryo-EM', 'BioRxiv']
    }
  ],
  'session-neuromorphic-ai': [
    {
      id: 'page-n1',
      url: 'https://ieeexplore.ieee.org/document/9658241',
      domain: 'ieee.org',
      title: 'Loihi 2: A 128-core asynchronous neuromorphic processor with programmable synaptic plasticity',
      excerpt: 'Detailed microarchitecture description of Intel Loihi 2 with programmable resonant integrate-and-fire dynamics and synchronous-free GALS routing.',
      authors: ['M. Davies', 'A. Wild', 'G. Orchard', 'Y. Sandamirskaya'],
      publishedDate: '2026-02-10',
      citationCount: 520,
      firstVisited: '2026-08-28T09:30:00.000Z',
      lastVisited: '2026-08-28T11:00:00.000Z',
      visitCount: 8,
      durationMs: 510000,
      readingTimeMinutes: 16,
      sourceType: 'academic',
      reliabilityScore: 0.98,
      tags: ['Neuromorphic', 'Loihi 2', 'IEEE']
    },
    {
      id: 'page-n2',
      url: 'https://science.org/doi/10.1126/science.abj3942',
      domain: 'science.org',
      title: 'Memristive crossbars for in-situ non-volatile synaptic matrix multiply',
      excerpt: 'Analog compute-in-memory arrays utilizing metal-oxide resistive switching cells with high linear conductance tuning.',
      authors: ['Q. Xia', 'J. J. Yang', 'S. R. Forrest'],
      publishedDate: '2026-04-05',
      citationCount: 380,
      firstVisited: '2026-08-28T10:15:00.000Z',
      lastVisited: '2026-08-28T10:50:00.000Z',
      visitCount: 3,
      durationMs: 220000,
      readingTimeMinutes: 12,
      sourceType: 'academic',
      reliabilityScore: 0.97,
      tags: ['Memristor', 'Science', 'In-Memory Compute']
    }
  ],
  'session-agent-alignment': [
    {
      id: 'page-a1',
      url: 'https://transformer-circuits.pub/2026/sae-monosemantic',
      domain: 'transformer-circuits.pub',
      title: 'Sparse Autoencoders Find Monosemantic Features in Frontier Language Models',
      excerpt: 'Resolving neural superposition by decomposing dense hidden states into millions of human-interpretable dictionary atoms.',
      authors: ['C. Olah', 'N. Nanda', 'A. Templeton', 'J. Batson'],
      publishedDate: '2026-05-18',
      citationCount: 410,
      firstVisited: '2026-09-03T11:20:00.000Z',
      lastVisited: '2026-09-03T12:30:00.000Z',
      visitCount: 7,
      durationMs: 490000,
      readingTimeMinutes: 25,
      sourceType: 'article',
      reliabilityScore: 0.99,
      tags: ['Mechanistic Interpretability', 'Sparse Autoencoders']
    }
  ],
  'session-crispr-base-edit': [
    {
      id: 'page-c1',
      url: 'https://nature.com/articles/s41587-026-01290-7',
      domain: 'nature.com',
      title: 'Engineered pegRNAs with structured 3 prime motifs for high-yield precision editing',
      excerpt: 'Stabilizing prime editing guide RNAs against nucleolytic decay using RNA secondary structures.',
      authors: ['D. R. Liu', 'A. V. Anzalone', 'P. B. Chen'],
      publishedDate: '2026-01-14',
      citationCount: 345,
      firstVisited: '2026-08-20T09:00:00.000Z',
      lastVisited: '2026-08-20T09:40:00.000Z',
      visitCount: 3,
      durationMs: 190000,
      readingTimeMinutes: 11,
      sourceType: 'academic',
      reliabilityScore: 0.97,
      tags: ['CRISPR', 'Prime Editing', 'Nature Biotech']
    }
  ]
};

export const MOCK_TIMELINES: Record<string, TimelineEntry[]> = {
  'session-quantum-pharma': [
    {
      id: 'time-1',
      type: 'SEARCH',
      timestamp: '2026-09-02T14:21:00.000Z',
      title: 'Initiated query: "VQE Hamiltonian mapping for kinase inhibitors"',
      url: 'https://scholar.google.com/scholar?q=VQE+Hamiltonian+mapping+kinase',
      summary: 'Targeted hybrid quantum-classical algorithms on NISQ processors for metalloprotein kinase active sites.',
      targetNodeId: 'q-search-1'
    },
    {
      id: 'time-2',
      type: 'PAGE_VISIT',
      timestamp: '2026-09-02T14:26:00.000Z',
      title: 'Discovered landmark paper: Scalable electronic structure calculations on noisy hardware',
      url: 'https://nature.com/articles/s41586-026-04921-x',
      domain: 'nature.com',
      summary: 'Kandala et al. demonstration of hardware-efficient ansatz reducing two-qubit gate depth by 42%.',
      targetNodeId: 'q-paper-nature-1',
      confidence: 0.98
    },
    {
      id: 'time-3',
      type: 'PAGE_VISIT',
      timestamp: '2026-09-02T14:40:00.000Z',
      title: 'Extracted resource bounds: Quantum Phase Estimation for KRAS-G12D',
      url: 'https://arxiv.org/abs/2608.10492',
      domain: 'arxiv.org',
      summary: 'Calculated requirement of 4.2 × 10^8 T-gates for fault-tolerant exact orbital calculation.',
      targetNodeId: 'q-paper-arxiv-1',
      confidence: 0.92
    },
    {
      id: 'time-4',
      type: 'AI_INSIGHT',
      timestamp: '2026-09-02T15:02:00.000Z',
      title: 'AI Synthesis: Hybrid VQE-GFMC projection bridge',
      summary: 'Synthesized theoretical connection: Auxiliary-field QMC projection bridges NISQ noise limits with 3.8x lower T-depth.',
      targetNodeId: 'q-ai-insight-1',
      confidence: 0.99
    },
    {
      id: 'time-5',
      type: 'SEARCH',
      timestamp: '2026-09-02T15:35:00.000Z',
      title: 'Secondary query: "Active site orbital truncation for metalloenzymes"',
      summary: 'Explored classical tensor compression methods to reduce qubit counts from 144 to 48.',
      targetNodeId: 'q-search-2'
    },
    {
      id: 'time-6',
      type: 'MILESTONE',
      timestamp: '2026-09-02T16:10:00.000Z',
      title: 'Identified Key Contradiction: 1D Ligand Tensor Supremacy',
      summary: 'Classical GPU-accelerated DMRG proven to surpass NISQ VQE fidelity for non-compact molecular topologies.',
      targetNodeId: 'q-ai-insight-2',
      confidence: 0.95
    }
  ],
  'session-neuromorphic-ai': [
    {
      id: 'time-n1',
      type: 'SEARCH',
      timestamp: '2026-08-28T09:16:00.000Z',
      title: 'Query: Event-driven spiking neural networks ultra-low power edge',
      targetNodeId: 'n-search-1'
    },
    {
      id: 'time-n2',
      type: 'PAGE_VISIT',
      timestamp: '2026-08-28T09:30:00.000Z',
      title: 'Analyzed Intel Loihi 2 Architecture Specification (IEEE)',
      url: 'https://ieeexplore.ieee.org/document/9658241',
      domain: 'ieee.org',
      targetNodeId: 'n-paper-ieee-1'
    },
    {
      id: 'time-n3',
      type: 'AI_INSIGHT',
      timestamp: '2026-08-28T10:45:00.000Z',
      title: 'AI Synthesis: Hybrid Digital-Analog Neuromorphic Advantage',
      summary: 'Identified 1000x energy efficiency regime by pairing analog memristor matrix cores with digital asynchronous event routing.',
      targetNodeId: 'n-ai-insight-1'
    }
  ],
  'session-agent-alignment': [
    {
      id: 'time-a1',
      type: 'SEARCH',
      timestamp: '2026-09-03T11:05:00.000Z',
      title: 'Query: Mechanistic interpretability for multi-step reasoning models',
      targetNodeId: 'a-search-1'
    },
    {
      id: 'time-a2',
      type: 'PAGE_VISIT',
      timestamp: '2026-09-03T11:20:00.000Z',
      title: 'Evaluated Anthropic Sparse Autoencoder monosemantic scaling paper',
      url: 'https://transformer-circuits.pub/2026/sae-monosemantic',
      domain: 'transformer-circuits.pub',
      targetNodeId: 'a-paper-safety'
    },
    {
      id: 'time-a3',
      type: 'AI_INSIGHT',
      timestamp: '2026-09-03T12:15:00.000Z',
      title: 'Synthesized Runtime Safety Feature Clamping Architecture',
      targetNodeId: 'a-ai-insight-1'
    }
  ],
  'session-crispr-base-edit': [
    {
      id: 'time-c1',
      type: 'SEARCH',
      timestamp: '2026-08-20T08:35:00.000Z',
      title: 'Query: Prime editing guide RNA optimization high efficiency',
      targetNodeId: 'c-search-1'
    },
    {
      id: 'time-c2',
      type: 'PAGE_VISIT',
      timestamp: '2026-08-20T09:00:00.000Z',
      title: 'Loaded Nature Biotechnology engineered pegRNA motifs',
      url: 'https://nature.com/articles/s41587-026-01290-7',
      domain: 'nature.com',
      targetNodeId: 'c-paper-nature'
    }
  ]
};

export const SUGGESTED_QUERIES = [
  'VQE Hamiltonian mapping for kinase inhibitors',
  'Sparse Autoencoders monosemantic alignment validation',
  'Cryo-EM allosteric pocket binding kinetics',
  'Memristive crossbar drift compensation algorithms',
  'Epigenetic chromatin remodelers in prime editing',
  'Non-Euclidean hyperbolic graph embeddings in drug discovery',
  'Fault-tolerant lattice surgery syndrome decoding benchmarks'
];
