export const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };
  
  export const getRandomAvatar = () => {
    const avatars = [
      'https://randomuser.me/api/portraits/men/1.jpg',
      'https://randomuser.me/api/portraits/women/2.jpg',
      'https://randomuser.me/api/portraits/men/3.jpg',
      'https://randomuser.me/api/portraits/women/4.jpg',
      'https://randomuser.me/api/portraits/men/5.jpg',
      'https://randomuser.me/api/portraits/women/6.jpg',
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };
  
  export const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      status: 'online',
      lastSeen: new Date(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      name: 'Bob Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      status: 'online',
      lastSeen: new Date(),
    },
    {
      id: '4',
      name: 'Alice Brown',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      status: 'away',
      lastSeen: new Date(Date.now() - 1800000),
    },
  ];
  
  export const mockMessages = {
    '1': [
      {
        _id: generateId(),
        text: 'Hey, how are you?',
        createdAt: new Date(Date.now() - 3600000),
        user: {
          _id: '1',
          name: 'John Doe',
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        },
      },
      {
        _id: generateId(),
        text: 'I am good, thanks! How about you?',
        createdAt: new Date(Date.now() - 3500000),
        user: {
          _id: 'currentUser',
          name: 'Current User',
          avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        },
      },
    ],
  };