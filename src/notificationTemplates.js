export function generateBasicNotification(text) {
  return {text};
}

export function generateBlobNotification({
  profile = '',
  id = '',
  correlationId = '',
  numberOfRecords = 0,
  failedRecords = 0,
  processedRecords = 0,
  created = 0,
  updated = 0,
  skipped = 0,
  error = 0
}, {environment = false, baseUrl = ''}) {
  return {
    'blocks': [
      {
        'type': 'header',
        'text': {
          'type': 'plain_text',
          'text': `${environment ? `${environment} - ` : ''}Record import blob: ${profile}`,
          'emoji': true
        }
      },
      {
        'type': 'divider'
      },
      {
        'type': 'rich_text',
        'elements': [
          {
            'type': 'rich_text_section',
            'elements': [
              {
                'type': 'text',
                'text': 'Id: ',
                'style': {
                  'bold': true
                }
              },
              {
                'type': 'text',
                'text': `${id}`
              }
            ]
          },
          {
            'type': 'rich_text_section',
            'elements': [
              {
                'type': 'text',
                'text': 'Correlation id: ',
                'style': {
                  'bold': true
                }
              },
              {
                'type': 'link',
                'url': `${baseUrl}/?id=${correlationId}`,
                'text': `${correlationId}`
              }
            ]
          }
        ]
      },
      {
        'type': 'rich_text',
        'elements': [
          {
            'type': 'rich_text_section',
            'elements': [
              {
                'type': 'text',
                'text': 'Transformation results',
                'style': {
                  'bold': true
                }
              }
            ]
          }
        ]
      },
      {
        'type': 'rich_text',
        'elements': [
          {
            'type': 'rich_text_list',
            'style': 'bullet',
            'indent': 1,
            'elements': [
              {
                'type': 'rich_text_section',
                'elements': [
                  {
                    'type': 'text',
                    'text': 'Number of records: '
                  },
                  {
                    'type': 'text',
                    'text': `${numberOfRecords}`
                  }
                ]
              },
              {
                'type': 'rich_text_section',
                'elements': [
                  {
                    'type': 'text',
                    'text': 'Failed records: '
                  },
                  {
                    'type': 'text',
                    'text': `${failedRecords}`
                  }
                ]
              },
              {
                'type': 'rich_text_section',
                'elements': [
                  {
                    'type': 'text',
                    'text': 'Processed records: '
                  },
                  {
                    'type': 'text',
                    'text': `${processedRecords}`
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        'type': 'rich_text',
        'elements': [
          {
            'type': 'rich_text_section',
            'elements': [
              {
                'type': 'text',
                'text': 'Process results',
                'style': {
                  'bold': true
                }
              }
            ]
          }
        ]
      },
      {
        'type': 'rich_text',
        'elements': [
          {
            'type': 'rich_text_list',
            'style': 'bullet',
            'indent': 1,
            'elements': [
              {
                'elements': [
                  {
                    'text': 'Created records: ',
                    'type': 'text'
                  },
                  {
                    'text': `${created}`,
                    'type': 'text'
                  }
                ],
                'type': 'rich_text_section'
              },
              {
                'elements': [
                  {
                    'text': 'Updated records: ',
                    'type': 'text'
                  },
                  {
                    'text': `${updated}`,
                    'type': 'text'
                  }
                ],
                'type': 'rich_text_section'
              },
              {
                'elements': [
                  {
                    'text': 'Skipped records: ',
                    'type': 'text'
                  },
                  {
                    'text': `${skipped}`,
                    'type': 'text'
                  }
                ],
                'type': 'rich_text_section'
              },
              {
                'elements': [
                  {
                    'text': 'Error records: ',
                    'type': 'text'
                  },
                  {
                    'text': `${error}`,
                    'type': 'text'
                  }
                ],
                'type': 'rich_text_section'
              }
            ]
          }
        ]
      },
      {
        'type': 'divider'
      }
    ]
  };
}
